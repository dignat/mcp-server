import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  CallToolRequestSchema,
  CallToolResultSchema,
  CallToolStructuredResultSchema,
  CallToolUnstructuredResultSchema,
  ListPromptsResultSchema,
  ListToolsRequestSchema,
  ListToolsResultSchema,
} from "@modelcontextprotocol/sdk/types.js";
import ollama, { Message, Ollama, Tool, ToolCall } from "ollama";
import { checkFile } from "./helpers/check-file.js";
import fs from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import * as readline from "readline";
import { MermaidInput, MermaidOutput, MermaidType } from "./types/mermaid-input-type.js";
import { isMermaid } from "./helpers/check-mermaid-type.js";
import * as mermaid from 'mermaid'

const detectType = mermaid.default.detectType;

const execAsync = promisify(exec);


export async function createMermaidFile(
  fileName: MermaidInput,
  dataToWrite?: MermaidType
) {
  const path = `./src/docs/${fileName}`;
  const exists = await checkFile(path as string);
  if (isMermaid(dataToWrite)) {
    console.log( 'WE HAVE A MERMAID')
  } else {
    console.log( 'Not a mermmaid file')
  }
  if (!exists && dataToWrite) {
    await fs.writeFile(path, dataToWrite);
  }
  return `File written in path ${path}`;
}

async function createFlowChartPng(
  mermaidCode: MermaidInput,
  flowchartFileName?: MermaidOutput
) {
  let inputFileName: string = "";
  let outputFileName: string = "";
  let chunk: string = "";
  const checkFileExtension = mermaidCode.split(".").pop();
  const exists = await checkFile(mermaidCode as string);
  if (!exists) {
    inputFileName = "./src/docs/" + `${mermaidCode}`;
    chunk = mermaidCode.split(".")[0];
    outputFileName = flowchartFileName
      ? `./src/assets/${flowchartFileName}`
      : `./src/assets${chunk}`;
  }
  if (mermaidCode.length) {
    await execAsync(
      `mmdc -i "${inputFileName}" -o "${outputFileName}" -t dark -b transparent`
    );
    //await run(inputFileName, outputFileName as `${string}.png` | `${string}.svg` | `${string}.pdf` | "/dev/stdout")
    console.log(
      ` i am going to ex ecute ${inputFileName} and ${outputFileName}`
    );
  } else {
    throw new Error(`Input not provided or extension unknown ${inputFileName}`);
  }
  if (
    (await checkFile(outputFileName)) ||
    (await checkFile(`./src/assets/${chunk}-1.png`))
  ) {
    return `File created in ${outputFileName}`;
  } else {
    throw new Error(
      `File was not created check the correct syntax for mermaid file ${inputFileName}`
    );
  }
}

await createMermaidFile('test.md', `\`\`\`mermaid
flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]
\`\`\``)

const transposrt = new StdioClientTransport({
  command: "node",
  args: ["build/index.js"],
});

const client = new Client(
  {
    name: "demo-client",
    version: "1.0.0",
  },
  {
    capabilities: {},
  }
);

await client.connect(transposrt);

const resourse = await client.listResources();

const resource = await client.readResource({
  uri: resourse.resources[0].uri,
});

console.log(resource.contents[0].text);

const response = await client.request(
  { method: "prompts/list" },
  ListPromptsResultSchema
);
console.log(
  "\nConnected to server with prompts:",
  response.prompts.map((prompt: any) => prompt.name)
);
const toolsResponse = await client.request(
  { method: "tools/list" },
  ListToolsResultSchema
);

console.log(
  "\nConnected to server with tools:"
  //toolsResponse.content?.map((tool: any) => tool)
);
const toolsFromMCP: Tool[] = [];
const messages: Message[] = [
  {
    role: "system",
    content: `You are an AWS Solution Architect Assistant. Your sole purpose is to help the user to,
     generate visual representation of any type of software or system design architecture you would need to. 
     You will use create-mermaid-file function to create mermaid diagram file with .md extension always using 
     a fenced code block with the mermaid language identifier, for an architecture design the user will specify and you will use the 
    file name of created mermaid diagram file to generate a flowchart by using flow-chart function. The input for flow-chart will be the file name
    and output will be a png file.
     Ask the user to provide:
     1. Type of architecture.
     2. File name.`,
  },
  // {role: "assistant", content: `I understand. I will neeed some more information.
  //     1. What type of architecture?
  //     2.Cloud based or on-premises based?
  //     3. If Cloud based type:
  //         3.1 AWS based?
  //         3.2 Azure based?
  //         3.3 CGP based?`},
  //     {role: "user",
  //         content: "I am interested in AWS design serveless architecture, that includes AWS S3, AWS Lambda, API Gateway. Also could you name the file serveless-design with .md extension , please?"},
  // {role: "assistant",
  //     content: `Of course. Let me see what ttols I have. I can use create-mermaid-file to generate a mermaid file for your architecture design.`}
];
toolsResponse.tools.map((tool: any) => {
  toolsFromMCP.push({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: tool.inputSchema.type,
        required: tool.inputSchema.required,
        properties: tool.inputSchema.properties,
      },
    },
  });
});
//console.log(tools)
async function agentLoop() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = () => {
    rl.question("Chat with history: ", async (userInput) => {
      if (userInput.toLowerCase() === "exit") {
        rl.close();
        return;
      }
      let responseContent = "";

      const ollamaResponse = await ollama.chat({
        model: "qwen3",
        messages: [
          ...messages,
          {
            role: "system",
            content: `You are a helpfull AWS Solution Architect Assistant. Your sole purpose is to help to,
            generate visual representation of any type of software or system design architecture for a given requirements.
            You will use create-mermaid-file function to create mermaid diagram file with .md extension always using 
            a fenced code block with the mermaid language identifier, for an architecture design the user will specify and you will use the 
            file name of created mermaid diagram file to generate a flowchart by using flow-chart function. The input for flow-chart will be the file name
            and output will be a png file. Also make sure the mermaid diagram has a correct syntax.
            Ask the user to provide:
            1. Type of architecture.
            2. File name.
            You only give short sentence by answer.`,
          },
          { role: "user", content: userInput },
        ],
        tools: toolsFromMCP,
        think: true,
        stream: true,
      });
      let inThinkMode = false;
      let thinking = "";
      let content = "";
      let toolCalls: ToolCall[] = [];

      for await (const chunk of ollamaResponse) {
        content = chunk.message.content;
        if (chunk.message.thinking) {
          thinking += chunk.message.thinking;
          process.stdout.write(chunk.message.thinking);
        }
        if (chunk.message.content) {
          if (!inThinkMode) {
            inThinkMode = true;
            process.stdout.write("\n");
          }
          const responseChunk = chunk.message.content;
          process.stdout.write(responseChunk);
          responseContent += responseChunk;
        }
        if (chunk.message.tool_calls?.length) {
          toolCalls.push(...chunk.message.tool_calls);
        }
      }
      if (thinking || content || toolCalls.length) {
        messages.push({
          role: "assistant",
          content: responseContent,
          thinking,
          tool_calls: toolCalls,
        });
      }
      messages.push(
        { role: "user", content: userInput },
        { role: "assistant", content: content }
      );
      askQuestion();
      if (!toolCalls.length) {
        return;
      }

      for (const call of toolCalls) {
        if (call.function.name === "create-mermaid-file") {
          const args = call.function.arguments;
          const result = await createMermaidFile(
            args.fileName,
            args.dataToWrite
          );
          messages.push({
            role: "tool",
            tool_name: call.function.name,
            content: result,
          });
        } else {
          messages.push({
            role: "tool",
            tool_name: call.function.name,
            content: "Unknown tool",
          });
        }
        if (call.function.name === "flow-chart") {
          const args = call.function.arguments;
          const input:
            | `${string}.md`
            | `${string}.markdown`
            | `${string}.mmd`
            | `${string}.mermaid` = args.input;
          const result = await createFlowChartPng(input, args.output);
          messages.push({
            role: "tool",
            tool_name: call.function.name,
            content: result,
          });
        } else {
          messages.push({
            role: "tool",
            tool_name: call.function.name,
            content: "Unknown tool",
          });
        }
      }
    });
  };

  askQuestion();
}
await agentLoop().catch(console.error);
//messages.push(ollamaResponse.message)
//console.log(ollamaResponse, 'content')
//console.log(ollamaResponse.message.tool_calls, 'tools')
//const call = ollamaResponse.message.tool_calls?.[0]
//const args = call?.function.arguments
//const result = await createMermaidFile(args?.fileName, args?.dataToWrite)
//messages.push({ role: 'tool', content: result })
//console.log(args, 'args')
//console.log(result, 'result')
// generate the final response
//  const finalResponse = await ollama.chat({ model: 'qwen3', messages, tools: toolsFromMCP, think: true })
//  console.log(finalResponse.message.content)
