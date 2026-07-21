#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
// @ts-ignore - GrabzIt doesn't provide official TS types
import grabzit from "grabzit";
import path from "path";
import os from "os";
// 1. Validate environment credentials
const APP_KEY = process.env.GRABZIT_APP_KEY;
const APP_SECRET = process.env.GRABZIT_APP_SECRET;
if (!APP_KEY || !APP_SECRET) {
    console.error("Missing GRABZIT_APP_KEY or GRABZIT_APP_SECRET environment variables");
    process.exit(1);
}
// 2. Initialize the MCP Server
const server = new Server({
    name: "grabzit-mcp-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// 3. Register the tools the LLM can use
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "grabzit_screenshot",
                description: "Captures a high-quality screenshot of a URL and returns it as an image that the AI can see.",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: { type: "string", description: "The URL of the webpage to screenshot." },
                        fullPage: { type: "boolean", description: "True to capture the whole page length, False for viewport only." },
                    },
                    required: ["url"],
                },
            },
            {
                name: "grabzit_pdf",
                description: "Converts a webpage to a PDF document, saves it locally, and returns the local file path.",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: { type: "string", description: "The URL of the webpage to convert to PDF." },
                    },
                    required: ["url"],
                },
            }
        ],
    };
});
// 4. Handle Tool Executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    // Initialize the GrabzIt client per request
    const client = new grabzit(APP_KEY, APP_SECRET);
    try {
        if (name === "grabzit_screenshot") {
            const url = String(args?.url);
            const fullPage = args?.fullPage !== false; // Defaults to true
            // -1 height forces GrabzIt to capture the full page length
            const options = fullPage ? { browserHeight: -1 } : {};
            client.url_to_image(url, options);
            // Wrap the callback-based save_to in a Promise
            const buffer = await new Promise((resolve, reject) => {
                // Passing null as the first argument returns the raw bytes
                client.save_to(null, (error, data) => {
                    if (error)
                        reject(error);
                    else
                        resolve(data);
                });
            });
            return {
                content: [
                    {
                        type: "image",
                        // MCP standard requires base64 encoding for images
                        data: buffer.toString("base64"),
                        mimeType: "image/jpeg"
                    }
                ]
            };
        }
        else if (name === "grabzit_pdf") {
            const url = String(args?.url);
            client.url_to_pdf(url);
            const fileName = `grabzit_${Date.now()}.pdf`;
            const filePath = path.join(os.tmpdir(), fileName);
            await new Promise((resolve, reject) => {
                client.save_to(filePath, (error) => {
                    if (error)
                        reject(error);
                    else
                        resolve();
                });
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `PDF successfully generated and saved to your local machine at: ${filePath}`
                    }
                ]
            };
        }
        else {
            throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        // Return a graceful error inside the context window rather than crashing
        return {
            content: [
                {
                    type: "text",
                    text: `GrabzIt Error: ${error.message}`
                }
            ],
            isError: true,
        };
    }
});
// 5. Connect the Transport
async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("GrabzIt MCP Server running via stdio");
}
run().catch(console.error);
