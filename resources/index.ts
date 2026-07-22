import type { McpServer } from "@modelcontextprotocol/server";
import { registerCartableResources } from "../domains/cartable/resource";

export function registerResources(server: McpServer) {
    registerCartableResources(server);
}