# GrabzIt MCP Server

The official Model Context Protocol (MCP) server for [GrabzIt](https://grabz.it). This server allows AI assistants (like Claude, Cursor, and Windsurf) to dynamically capture website screenshots, generate PDF and DOCX documents, and scrape web data directly within your AI environment.

## 🚀 Quick Start

This server is published on npm and can be executed instantly without installation using `npx`. 

You will need a GrabzIt Application Key and Secret, which you can get by creating an account at [grabz.it](https://grabz.it/api/).

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

* **`capture_screenshot`**
  Captures a high-fidelity PNG or JPEG screenshot of a live URL or raw HTML string. Allows customization of browser viewport and simulated device environments.
* **`generate_pdf`**
  Converts a live URL or AI-generated HTML snippet directly into a properly formatted, print-ready PDF document.
* **`generate_docx`**
  Converts a live URL or HTML content into a Microsoft Word (DOCX) document for easy editing and sharing.
* **`scrape_webpage`**
  Extracts clean, structured data or raw HTML from target web pages, enabling the AI to bypass basic fetching limitations and perform deep data analysis.

## 📝 Usage Examples

Once connected, you can ask your AI client prompts like:
* *"Take a screenshot of https://news.ycombinator.com and summarize the top stories."*
* *"Create an HTML invoice for 3 hours of web development, and use GrabzIt to generate a PDF copy."*
* *"Scrape the main headings and links from example.com."*

## 📄 License

This project is open-source and available under the MIT License.
