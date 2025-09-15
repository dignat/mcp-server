import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const transposrt = new StdioClientTransport({
    command: 'node',
    args: ['index.js']
});
const client = new Client({
    name: 'demo-client',
    version: '1.0.0'
});
await client.connect(transposrt);
const resourse = await client.listResources();
const resource = await client.readResource({
    uri: resourse.resources[0].uri
});
console.log(resource.contents[0].text);
