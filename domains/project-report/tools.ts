import type {
    CallToolResult,
    McpServer,
    ServerContext,
} from "@modelcontextprotocol/server";
import { ApiRequestError } from "../../utils/axios";
import {
    getProjectReportInputSchema,
    getProjectReportOutputSchema,
    getProjectReportsInputSchema,
    getProjectReportsOutputSchema,
    updateProjectReportPlansInputSchema,
    updateProjectReportPlansOutputSchema,
} from "./schema";
import {
    fetchProjectReport,
    fetchProjectReports,
    updateProjectReportPlans,
} from "./services";
import { z } from "zod/v4";

function missingTokenResult(): CallToolResult {
    return {
        content: [{ type: "text", text: "Missing auth token." }],
        isError: true,
    };
}

function errorResult(prefix: string, error: unknown): CallToolResult {
    const message =
        error instanceof ApiRequestError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Request failed";

    return {
        content: [{ type: "text", text: `${prefix}: ${message}` }],
        isError: true,
    };
}

function successResult(output: Record<string, unknown>): CallToolResult {
    return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
    };
}

function registerGetProjectReports(server: McpServer) {
    server.registerTool(
        "get-project-reports",
        {
            title: "Get Project Reports",
            description:
                "List project progress reports (گزارشات ارسالی پروژه). Optionally filter by projectId, dates, search text, and confirmStatus (approved|rejected|pending|all). Set includeExtras=true to attach activity details and comments (large). After cartable entityTypeId=7, call this with the cartable item's projectId.",
            inputSchema: getProjectReportsInputSchema,
            outputSchema: getProjectReportsOutputSchema,
        },
        async (
            args: z.infer<typeof getProjectReportsInputSchema>,
            ctx: ServerContext,
        ): Promise<CallToolResult> => {
            const token = ctx.http?.authInfo?.token;
            if (!token) return missingTokenResult();

            const input = getProjectReportsInputSchema.parse(args);

            try {
                const reports = await fetchProjectReports(token, {
                    projectId: input.projectId,
                    confirmStatus: input.confirmStatus,
                    includeExtras: input.includeExtras,
                    filters: {
                        fromDate: input.fromDate,
                        toDate: input.toDate,
                        query: input.query,
                        unitId: input.unitId,
                        strategyId: input.strategyId,
                        statusIds: input.statusIds,
                    },
                });
                return successResult({ reports });
            } catch (error) {
                return errorResult("Failed to fetch project reports", error);
            }
        },
    );
}

function registerGetProjectReport(server: McpServer) {
    server.registerTool(
        "get-project-report",
        {
            title: "Get Project Report",
            description:
                "Get one project report by projectReportId, including activity details and comments. Pass projectId when known (e.g. from cartable or get-project-reports) for a faster scoped lookup.",
            inputSchema: getProjectReportInputSchema,
            outputSchema: getProjectReportOutputSchema,
        },
        async (
            args: z.infer<typeof getProjectReportInputSchema>,
            ctx: ServerContext,
        ): Promise<CallToolResult> => {
            const token = ctx.http?.authInfo?.token;
            if (!token) return missingTokenResult();

            const input = getProjectReportInputSchema.parse(args);

            try {
                const report = await fetchProjectReport(token, {
                    projectReportId: input.projectReportId,
                    projectId: input.projectId,
                });
                return successResult({ report });
            } catch (error) {
                return errorResult("Failed to fetch project report", error);
            }
        },
    );
}

function registerUpdateProjectReportPlans(server: McpServer) {
    server.registerTool(
        "update-project-report-plans",
        {
            title: "Update Project Report Plans",
            description:
                "Update planned amounts (material/man/machine/contractor) on a project report. Only users listed in the ControlProject setting may call this. Requires projectReportId + projectId and the four plan amount fields.",
            inputSchema: updateProjectReportPlansInputSchema,
            outputSchema: updateProjectReportPlansOutputSchema,
        },
        async (
            args: z.infer<typeof updateProjectReportPlansInputSchema>,
            ctx: ServerContext,
        ): Promise<CallToolResult> => {
            const token = ctx.http?.authInfo?.token;
            if (!token) return missingTokenResult();

            const input = updateProjectReportPlansInputSchema.parse(args);

            try {
                const result = await updateProjectReportPlans(token, {
                    projectReportId: input.projectReportId,
                    projectId: input.projectId,
                    planMaterialAmount: input.planMaterialAmount,
                    planManAmount: input.planManAmount,
                    planMachineAmount: input.planMachineAmount,
                    planContractorAmount: input.planContractorAmount,
                });
                return successResult(result);
            } catch (error) {
                return errorResult("Failed to update project report plans", error);
            }
        },
    );
}

export function registerProjectReportTools(server: McpServer) {
    registerGetProjectReports(server);
    registerGetProjectReport(server);
    registerUpdateProjectReportPlans(server);
}
