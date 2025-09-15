import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '@mermaid-js/mermaid-cli';
import fs from 'fs/promises';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const server = new Server({
    name: 'docs-demo',
    version: '1.0.0'
}, {
    capabilities: {
        resources: {},
        tools: {}
    }
});
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: 'file://' + __dirname + '/docs/integration.md',
                name: 'Integration docs',
                mimeType: 'text/plain'
            }
        ]
    };
});
const docFiles = await fs.readFile('./src/docs/integration.md');
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    console.log(uri, 'URI');
    if (uri === 'file://' + __dirname + '/docs/integration.md') {
        return {
            contents: [
                {
                    uri,
                    type: 'text/plain',
                    text: docFiles.toString('utf-8')
                }
            ]
        };
    }
    throw new Error('Resource not found');
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [{
                name: 'flow-chart',
                description: 'Display flow chart with mermaid',
                inputSchema: {
                    type: 'object',
                    properties: {
                        input: { type: 'string' },
                        output: { type: 'string' }
                    },
                    required: ['input', 'output']
                },
                annotations: {
                    title: "Flow chart views",
                }
            },
            {
                name: 'analyze_csv',
                description: 'Analyze CSV file',
                inputSchema: {
                    type: 'object',
                    properties: {
                        filepath: { type: 'string' },
                        operations: {
                            type: 'array',
                            items: {
                                enum: ['sum', 'average', 'count']
                            }
                        }
                    },
                    required: ['filepath']
                },
                annotations: {
                    title: "Analyze CSV file",
                }
            }
        ]
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'flow-chart') {
        const input = request.params.arguments?.input;
        const output = request.params.arguments?.output;
        await run(input, output);
        return {
            content: {
                uri: 'file://' + `${output}`,
                type: 'image/png'
            }
        };
    }
    if (request.params.name === 'analyze_csv') {
        const filepath = request.params.arguments?.filepath;
        const operations = request.params.arguments?.operations;
        const content = await fs.readFile(filepath, 'utf-8');
        const lines = content.split('\n');
        const headers = lines[0].split(',');
        const data = lines.slice(1).map(line => line.split(','));
        const result = operations.map(operation => {
            switch (operation) {
                case 'sum':
                    return headers.map((header, index) => {
                        const sum = data.map(row => parseFloat(row[index])).reduce((a, b) => a + b, 0);
                        return `${header}: ${sum}`;
                    });
                case 'average':
                    return headers.map((header, index) => {
                        const sum = data.map(row => parseFloat(row[index])).reduce((a, b) => a + b, 0);
                        return `${header}: ${sum / data.length}`;
                    });
                case 'count':
                    return headers.map((header, index) => {
                        return `${header}: ${data.length}`;
                    });
                default:
                    return [];
            }
        });
        return {
            content: {
                uri: 'file://' + __dirname + '/assets' + `${filepath}.json`,
                type: 'application/json',
                text: JSON.stringify(result)
            }
        };
    }
    throw new Error('Tool not found');
});
const transposrt = new StdioServerTransport();
console.log('Starting server...');
await server.connect(transposrt);
console.log('Server started');
server.sendToolListChanged();
server.sendResourceListChanged();
