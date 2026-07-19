import type { McpServer } from "@modelcontextprotocol/server";
import createEchoTool from "./echo";
import createUsersTool from "./users";

export default function registerTools(server: McpServer) {
      createEchoTool(server);
      createUsersTool(server);
}