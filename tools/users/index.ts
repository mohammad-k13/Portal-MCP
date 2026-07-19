import type { McpServer } from "@modelcontextprotocol/server";
import getUserInfo from "./get-user-info";

export default function createUsersTool(server: McpServer) {
      getUserInfo(server);
};