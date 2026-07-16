import { McpServer } from "@modelcontextprotocol/server";
import registerTools from "../tools";

export default async function createServer() {
    const server = new McpServer({
        name: "portal-mcp",
        description: "Portal MCP",
        version: "1.0.0",
    }, {
      capabilities: {
            tools: {
                  listChanged: true,
            }
      }
    });

    registerTools(server);

    return server;
}
