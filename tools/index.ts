import type { McpServer } from "@modelcontextprotocol/server";
import createEchoTool from "./echo";

export default function registerTools(server: McpServer) {
      createEchoTool(server);
}