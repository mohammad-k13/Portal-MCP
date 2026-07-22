import { McpServer } from "@modelcontextprotocol/server";
import registerTools from "../tools";
import { registerResources } from "../resources";

export default async function createServer() {
    const server = new McpServer({
        name: "portal-mcp",
        description: "Portal MCP",
        version: "1.0.0",
    }, {
      capabilities: {
            tools: {
                  listChanged: true,
            },
            resources: {
                  listChanged: true,
            },
      }
    });

    registerTools(server);
    registerResources(server);

    return server;
}
