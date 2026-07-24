# GrabzIt MCP Server

The official Model Context Protocol (MCP) server for [GrabzIt](https://grabz.it/). This server allows AI assistants (like Claude, Cursor, and Windsurf) to dynamically capture website screenshots, generate PDF and DOCX documents, and scrape web data directly within your AI environment.

## 🚀 Quick Start

This server is published on npm and can be executed instantly without installation using `npx`. 

You will need a GrabzIt Application Key and Secret, which you can get by creating an account at [GrabzIt](https://grabz.it/api/).

### Configuration

Add the following configuration to your MCP-compatible client (e.g., `claude_desktop_config.json`). Replace `<YOUR_APP_KEY>` and `<YOUR_APP_SECRET>` with your actual GrabzIt credentials.

```json
{
  "mcpServers": {
    "grabzit": {
      "command": "npx",
      "args": [
        "-y",
        "@grabzit/mcp-server"
      ],
      "env": {
        "GRABZIT_APP_KEY": "<YOUR_APP_KEY>",
        "GRABZIT_APP_SECRET": "<YOUR_APP_SECRET>"
      }
    }
  }
}
```

## 🛠️ Environment Variables

The server requires the following environment variables to authenticate with the GrabzIt API:

* `GRABZIT_APP_KEY` - Your GrabzIt Application Key.
* `GRABZIT_APP_SECRET` - Your GrabzIt Application Secret.

## Tools

* **`grabzit_inspect_url`**
  Captures a screenshot of a URL and returns it as an image that the AI can view directly in context. Supports full page captures, rendering delays for SPAs, element cropping via CSS selectors, and element stripping.
* **`grabzit_scrape_html`**
  Extracts fully-rendered HTML from a target URL after JavaScript execution completes. Supports custom rendering delays.
* **`grabzit_convert_url`**
  Converts a target URL to an image (`png`, `jpg`, `svg`, `tiff`), PDF, or DOCX document. Supports page orientation, paper sizing, element cropping/stripping, and rendering delays.
* **`grabzit_convert_html`**
  Converts raw HTML string content into an image (`png`, `jpg`, `svg`, `tiff`), PDF, or DOCX document. Supports page orientation, paper sizing, element cropping/stripping, and rendering delays.

## 📝 Usage Examples

Once connected, you can ask your AI client prompts like:
* *"Inspect https://news.ycombinator.com using GrabzIt and tell me what you see in the screenshot."*
* *"Scrape the rendered HTML of https://example.com after waiting 2000ms for dynamic content to load."*
* *"Convert https://example.com into an A4 PDF in landscape orientation using GrabzIt."*
* *"Take this HTML string invoice and convert it into a downloadable DOCX document."*

## 📄 License

This project is open-source and available under the ISC License.

## 🔒 Privacy Policy

This MCP server acts as a secure bridge between your local AI environment and the GrabzIt API. 
* Your `GRABZIT_APP_KEY` and `GRABZIT_APP_SECRET` remain stored locally on your machine.
* Any URLs or HTML data processed through this server are governed by the official [GrabzIt Privacy Policy](https://grabz.it/legal/privacy-policy/).
