import type { McpServer } from "@modelcontextprotocol/server";
import { registerCartableResources } from "../domains/cartable/resource";
import { registerProjectReportResources } from "../domains/project-report/resource";

export function registerResources(server: McpServer) {
    registerCartableResources(server);
    registerProjectReportResources(server);
}
