#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
// @ts-ignore - GrabzIt doesn't provide official TS types
import grabzit from "grabzit";
import path from "node:path";
import os from "node:os";
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
                name: "grabzit_inspect_url",
                description: "Captures a screenshot of a URL and returns it as an image that the AI can see.",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: { type: "string", description: "The URL of the webpage to screenshot." },
                        fullPage: { type: "boolean", description: "True to capture the whole page length, False for viewport only." },
                        delay: {
                            type: "number",
                            description: "Delay in milliseconds before capture (useful for dynamic SPAs or animations)."
                        },
                        targetElement: {
                            type: "string",
                            description: "CSS selector of a specific element to crop and capture (e.g. '#chart' or '.main-content')."
                        },
                        hideElement: {
                            type: "string",
                            description: "CSS selector of elements to strip out before capture (e.g. '.cookie-banner' or '#popup')."
                        },
                    },
                    required: ["url"],
                },
            },
            {
                name: "grabzit_scrape_html",
                description: "Extracts fully-rendered HTML from a URL after JavaScript executes.",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: { type: "string", description: "The URL of the webpage to scrape." },
                        delay: { type: "number", description: "Milliseconds to wait for JS rendering before extracting the DOM." }
                    },
                    required: ["url"],
                },
            },
            {
                name: "grabzit_convert_url",
                description: "Converts a URL to an Image, PDF, or DOCX.",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: { type: "string", description: "The URL of the webpage to convert." },
                        format: {
                            type: "string",
                            enum: ["png", "svg", "jpg", "tiff", "pdf", "docx", "html", "mp4"],
                            description: "Output format. Defaults to 'jpg'."
                        },
                        delay: {
                            type: "number",
                            description: "Delay in milliseconds before capture (useful for dynamic SPAs or animations)."
                        },
                        targetElement: {
                            type: "string",
                            description: "CSS selector of a specific element to crop and capture (e.g. '#chart' or '.main-content')."
                        },
                        hideElement: {
                            type: "string",
                            description: "CSS selector of elements to strip out before capture (e.g. '.cookie-banner' or '#popup')."
                        },
                        orientation: {
                            type: "string",
                            enum: ["Portrait", "Landscape"],
                            description: "Page orientation for PDF/DOCX formats."
                        },
                        pageSize: {
                            type: "string",
                            enum: ["A4", "Letter", "Legal"],
                            description: "Paper size for PDF/DOCX formats."
                        }
                    },
                    required: ["url"],
                },
            },
            {
                name: "grabzit_convert_html",
                description: "Converts raw HTML string to an Image, PDF, or DOCX.",
                inputSchema: {
                    type: "object",
                    properties: {
                        html: { type: "string", description: "The URL of the webpage to convert." },
                        format: {
                            type: "string",
                            enum: ["png", "svg", "jpg", "tiff", "pdf", "docx", "html", "mp4"],
                            description: "Output format. Defaults to 'jpg'."
                        },
                        delay: {
                            type: "number",
                            description: "Delay in milliseconds before capture (useful for dynamic SPAs or animations)."
                        },
                        targetElement: {
                            type: "string",
                            description: "CSS selector of a specific element to crop and capture (e.g. '#chart' or '.main-content')."
                        },
                        hideElement: {
                            type: "string",
                            description: "CSS selector of elements to strip out before capture (e.g. '.cookie-banner' or '#popup')."
                        },
                        orientation: {
                            type: "string",
                            enum: ["Portrait", "Landscape"],
                            description: "Page orientation for PDF/DOCX formats."
                        },
                        pageSize: {
                            type: "string",
                            enum: ["A4", "Letter", "Legal"],
                            description: "Paper size for PDF/DOCX formats."
                        }
                    },
                    required: ["html"],
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
        if (name === "grabzit_inspect_url") {
            const url = String(args?.url);
            const fullPage = args?.fullPage !== false; // Defaults to true
            const options = buildGrabzitOptions(args, "jpg");
            options.quality = 70; // Compress the JPEG
            options.width = 1024; // Shrink the output image width to drastically reduce file size
            // -1 height forces GrabzIt to capture the full page length
            if (fullPage) {
                options.browserHeight = -1;
            }
            client.url_to_image(url, options);
            const rawData = await new Promise((resolve, reject) => {
                client.save_to(null, (error, data) => {
                    if (error)
                        reject(error);
                    else
                        resolve(data);
                });
            });
            const base64Image = Buffer.isBuffer(rawData)
                ? rawData.toString("base64")
                : Buffer.from(rawData, "binary").toString("base64");
            return {
                content: [
                    {
                        type: "image",
                        data: base64Image,
                        mimeType: "image/jpeg"
                    }
                ]
            };
        }
        else if (name === "grabzit_convert_url") {
            const format = String(args?.format || "jpg").toLowerCase();
            const options = buildGrabzitOptions(args, format);
            const url = String(args?.url);
            if (format?.toLocaleLowerCase() == "pdf") {
                client.url_to_pdf(url, options);
            }
            else if (format?.toLocaleLowerCase() == "docx") {
                client.url_to_docx(url, options);
            }
            else {
                client.url_to_image(url, options);
            }
            return await generateFile(client, format);
        }
        else if (name === "grabzit_convert_html") {
            const format = String(args?.format || "jpg").toLowerCase();
            const options = buildGrabzitOptions(args, format);
            const html = String(args?.html);
            if (format?.toLocaleLowerCase() == "pdf") {
                client.html_to_pdf(html, options);
            }
            else if (format?.toLocaleLowerCase() == "docx") {
                client.html_to_docx(html, options);
            }
            else {
                client.html_to_image(html, options);
            }
            return await generateFile(client, format);
        }
        else if (name === "grabzit_scrape_html") {
            const options = {};
            const url = String(args?.url);
            if (args?.delay)
                options.delay = Number(args?.delay);
            client.url_to_rendered_html(url, options);
            const rawData = await new Promise((resolve, reject) => {
                client.save_to(null, (error, data) => {
                    if (error)
                        reject(error);
                    else
                        resolve(data);
                });
            });
            let htmlString = Buffer.isBuffer(rawData)
                ? rawData.toString("utf-8")
                : String(rawData);
            // Safety threshold: ~800KB (leaves room for JSON-RPC framing)
            const MAX_CHARS = 800000;
            if (htmlString.length > MAX_CHARS) {
                htmlString =
                    htmlString.substring(0, MAX_CHARS) +
                        "\n\n<!-- [GRABZIT NOTICE: Rendered HTML truncated here because it exceeded the 800KB payload limit.] -->";
            }
            return {
                content: [
                    {
                        type: "text",
                        text: htmlString
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
function buildGrabzitOptions(args, format) {
    const options = {};
    // --- Universal Options (Works across all formats) ---
    if (args.delay)
        options.delay = Number(args.delay);
    if (args.hideElement)
        options.hideElement = String(args.hideElement);
    if (args.targetElement)
        options.targetElement = String(args.targetElement);
    if (format?.toLocaleLowerCase() == 'pdf' || format?.toLocaleLowerCase() == 'docx') {
        if (args.orientation)
            options.orientation = String(args.orientation);
        if (args.pageSize)
            options.pageSize = String(args.pageSize);
    }
    else {
        options.format = format;
    }
    return options;
}
async function generateFile(client, format) {
    const fileName = `grabzit_${Date.now()}.${format}`;
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
                text: `SUCCESS: Output generated as local file at: ${filePath}\n` +
                    `File format: ${format.toUpperCase()}\n` +
                    `Note: This file is located on the local filesystem of the user's host machine.`
            }
        ]
    };
}
// 5. Connect the Transport
async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("GrabzIt MCP Server running via stdio");
}
run().catch(console.error);
