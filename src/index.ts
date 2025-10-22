import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, 
    ListResourcesRequestSchema, 
    ListToolsRequestSchema, ReadResourceRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {run} from '@mermaid-js/mermaid-cli';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { checkFile } from './helpers/check-file.js';

const execAsync = promisify(exec); // to execute shell commads

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const server = new Server({
    name: 'docs-demo',
    version: '1.0.0'
    }, {
        capabilities: {
            resources: {},
            tools: {},
            prompts: {
                
            }
        }
    }
);
export type Markdown = `${string}.md` | `${string}.markdown` | `${string}.mmd`
type Prompt = {
    [key:string]: {
        name: string,
        description: string,
        arguments: 
            {
                name: string,
                required: boolean
            }[]
        
    }
}

const PROMPTS: Prompt = {
    "create-mermaid-file": {
        name: 'create-mermaid-file',
        description: `Create mermaid file with or without provided fileName or dataToWrite. If fileName or dataTowrite is not
         provided ask what type of content should mermaid file contain and propose a fileName`,
        arguments: [
            {
                name: 'fileName',
                required: true
            },
            {
                name: 'dataToWrite',
                required: true
            }
        ]
    },
    
        "flow-chart": {
            name: 'flow-chart',
            description: `Creates a png file from a mermaid file if mermaid file exists in ./src/docs directory. If it does not exists
            use create-mermaid-file to create a mermaid file`,
            arguments: [
                {
                    name: 'input',
                    required: true
                },
                {
                    name: 'output',
                    required: true
                }
            ]
        }
    
}

  // List available prompts
 server.setRequestHandler(ListPromptsRequestSchema, async () => {
     return {
         prompts: Object.values(PROMPTS)
        };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const name = request.params.name;
    const prompt = PROMPTS[name]
      if (!prompt) {
        throw new Error(`Prompt not found: ${request.params.name}`);
      }
      if(name === 'create-mermaid-file') {
        return {
            messages: [
                {
                    role: 'user',
                    content: {
                    type: 'text',
                    text: `Could you create a mermaid file for a given architecture design pattern or idea?`
                    }
                },
                {
                    role: 'assistant',
                    content: {
                        type: 'text',
                        text: `Sure thing. Let me know what type of design architecture pattern you have in mind, or about what type 
                        of architecture design idea you are thinking.`
                    }
                },
            ]
        }
      }
      if (name === 'flow-chart') {
        return {
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Generate a flowchart with provided mermaid filename ${request.params.arguments?.input} 
                        if exists in ./src/docs/ directory and generate an output png file ${request.params.arguments?.output}
                        in ./src/assets/ directory`
                    }
                }
            ]
        }
      }

throw new Error("Prompt implementation not found");

})

server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources:[
            {
            uri: 'file://' + __dirname + '/docs/integration.md',
            name: 'Integration docs',
            mimeType: 'text/plain'
            }
        ]
    }
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    if (uri === 'file://' + __dirname + '/docs/integration.md') {
        const docFiles = await fs.readFile('./src/docs/integration.md');
        return {
            contents: [
                {
                    uri,
                    type: 'text/plain',
                    text: docFiles.toString('utf-8')
                }
            ]
        }
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
                   input: {type: 'string'},
                   output: {type: 'string'}
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
                    filepath: {type: 'string'},
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
        },
        {
            name: 'create-mermaid-file',
            description: 'Creates mermaid flow chart file if it does not exists',
            inputSchema: {
                type: 'object',
                properties: {
                    fileName: {type: 'string'},
                    dataToWrite: {type: 'string'},
                },
                required: ['fileName', 'dataToWrite']
            },
            annotations: {
                title: 'Create mermaid flow chart file'
            }
        }
    ]
}
});

let useMermaidFileName = '';

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'create-mermaid-file') {
        const fileName = request.params.arguments?.fileName as string;
        const dataToWrite = request.params.arguments?.dataToWrite;
        const path = `./src/docs/${fileName}`;
        const exists = await checkFile(path as string);
        useMermaidFileName = fileName as `${string}.md` | `${string}.mmd`;
        if (!exists) {
            await fs.writeFile(path, dataToWrite as string)
        }
        return {
            content: [{
                text: `File is created in ${path}`,
                type: 'text'
            }]
        }
    }
    if (request.params.name === 'flow-chart') {
        let input: `${string}.md` | `${string}.markdown` | `${string}.mmd`;
        let output:  `${string}.png` | `${string}.svg` | `${string}.pdf` | "/dev/stdout" | string;
        const exists = await checkFile(request.params.arguments?.input as string);
        
        if (exists) {
            const inputParam =  request.params.arguments?.input as `${string}.md` | `${string}.markdown` | `${string}.mmd`
            const outputParam = request.params.arguments?.output as `${string}.png` | `${string}.svg` | `${string}.pdf` | "/dev/stdout";
            const inputExtension = inputParam.split('.').pop();
            const outputExtension = outputParam.split('.').pop()
            input = inputExtension === 'md' || inputExtension === 'mmd' ? inputParam : `${inputParam}.mmd`
            output = outputExtension === 'png' ? outputParam : `${outputParam.replace(/\s/g, "").toLowerCase()}.png`
        } else {
            input = './src/docs/'  + `${useMermaidFileName}`;
            useMermaidFileName.split('.').pop() 
            output = `${useMermaidFileName}.png`
        } 
        const checkFileExtension = input.split('.').pop()       
        if (input.length && (checkFileExtension === 'mmd' || checkFileExtension === 'md')) {
             await execAsync(`mmdc -i "${input}" -o "./src/assets/${output}"`);
        } else {
            throw new Error('input is not provided')
        }
        return {
            content: [{
                text: `I have created a file in ./src/assets/${output}`,
                type: 'text'
            }]
        }
    }
    if (request.params.name === 'analyze_csv') {
        const filepath = request.params.arguments?.filepath as string;
        const operations = request.params.arguments?.operations as string[];
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
            content: [{
                type: 'text',
                text: JSON.stringify(result)
            }]
        }
    }
    throw new Error('Tool not found');
})


const transport = new StdioServerTransport();
await server.connect(transport);
server.sendToolListChanged()
server.sendResourceListChanged()
server.sendPromptListChanged()