import type { McpServer } from "@modelcontextprotocol/server";
import createEchoTool from "./echo";
import createUsersTool from "./users";
import { registerCartableTools } from "../domains/cartable/tools";

export default function registerTools(server: McpServer) {
      createEchoTool(server);
      createUsersTool(server);
      registerCartableTools(server);
}