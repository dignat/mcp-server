import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';
const transposrt = new StdioClientTransport({
    command: 'node',
    args: ['build/index.js']
});
const client = new Client({
    name: 'demo-client',
    version: '1.0.0'
}, {
    capabilities: {},
});
await client.connect(transposrt);
const resourse = await client.listResources();
const resource = await client.readResource({
    uri: resourse.resources[0].uri
});
console.log(resource.contents[0].text);
const response = await client.request({ method: "tools/list" }, ListToolsResultSchema);
console.log("\nConnected to server with tools:", response.tools.map((tool) => tool.name));
