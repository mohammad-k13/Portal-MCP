import type { McpServer } from "@modelcontextprotocol/server";
import createEchoTool from "./echo";
import createUsersTool from "./users";
import { registerCartableTools } from "../domains/cartable/tools";
import { registerManageProjectTools } from "../domains/manage-project/tools";
import { registerProjectReportTools } from "../domains/project-report/tools";

export default function registerTools(server: McpServer) {
      createEchoTool(server);
      createUsersTool(server);
      registerCartableTools(server);
      registerProjectReportTools(server);
      registerManageProjectTools(server);
}