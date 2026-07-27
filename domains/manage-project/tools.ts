import type {
    CallToolResult,
    McpServer,
    ServerContext,
} from "@modelcontextprotocol/server";
import { ApiRequestError } from "../../utils/axios";
import {
    getManageProjectInputSchema,
    getManageProjectOutputSchema,
    getManageProjectsInputSchema,
    getManageProjectsOutputSchema,
    getProjectCommentCapabilityInputSchema,
    getProjectCommentCapabilityOutputSchema,
    getProjectScheduleInputSchema,
    getProjectScheduleOutputSchema,
    insertProjectCommentInputSchema,
    insertProjectCommentOutputSchema,
    updateProjectStatusInputSchema,
    updateProjectStatusOutputSchema,
} from "./schema";
import {
    fetchManageProject,
    fetchManageProjects,
    fetchProjectCommentCapability,
    fetchProjectSchedule,
    insertProjectComment,
    updateProjectStatus,
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

function registerGetManageProjects(server: McpServer) {
    server.registerTool(
        "get-manage-projects",
        {
            title: "Get Manage Projects",
            description:
                "List projects from Portal manageproject (GetAllForManage) with statuses and per-project commentCapability for the current user. Set includeSCurve=true for SCurve series (large). Use before insert-project-comment.",
            inputSchema: getManageProjectsInputSchema,
            outputSchema: getManageProjectsOutputSchema,
        },
        async (
            args: z.infer<typeof getManageProjectsInputSchema>,
            ctx: ServerContext,
        ): Promise<CallToolResult> => {
            const token = ctx.http?.authInfo?.token;
            if (!token) return missingTokenResult();

            const input = getManageProjectsInputSchema.parse(args);
            try {
                const result = await fetchManageProjects(token, {
                    fromDateFa: input.fromDateFa,
                    toDateFa: input.toDateFa,
                    includeSCurve: input.includeSCurve,
                    includeCapability: input.includeCapability,
                });
                return successResult({
                    projects: result.projects,
                    projectStatuses: result.projectStatuses,
                    controlProjectTypeId: result.controlProjectTypeId,
                    canEditProjectStatus: result.canEditProjectStatus,
                    ...(result.projectsSCurve
                        ? { projectsSCurve: result.projectsSCurve }
                        : {}),
                });
            } catch (error) {
                return errorResult("Failed to fetch manage projects", error);
            }
        },
    );
}

function registerGetManageProject(server: McpServer) {
    server.registerTool(
        "get-manage-project",
        {
            title: "Get Manage Project",
            description:
                "Get one project by projectId from manageproject, including manager comments and commentCapability. Optional includeSCurve.",
            inputSchema: getManageProjectInputSchema,
            outputSchema: getManageProjectOutputSchema,
        },
        async (
            args: z.infer<typeof getManageProjectInputSchema>,
            ctx: ServerContext,
        ): Promise<CallToolResult> => {
            const token = ctx.http?.authInfo?.token;
            if (!token) return missingTokenResult();

            const input = getManageProjectInputSchema.parse(args);
            try {
                const result = await fetchManageProject(token, {
                    projectId: input.projectId,
                    includeSCurve: input.includeSCurve,
                });
                return successResult({
                    project: result.project,
                    projectStatuses: result.projectStatuses,
                    controlProjectTypeId: result.controlProjectTypeId,
                    canEditProjectStatus: result.canEditProjectStatus,
                    ...(result.sCurve ? { sCurve: result.sCurve } : {}),
                });
            } catch (error) {
                return errorResult("Failed to fetch manage project", error);
            }
        },
    );
}

function registerGetProjectSchedule(server: McpServer) {
    server.registerTool(
        "get-project-schedule",
        {
            title: "Get Project Schedule",
            description:
                "List schedule activities for a project (Project/GetAllProjectScheduleForManage).",
            inputSchema: getProjectScheduleInputSchema,
            outputSchema: getProjectScheduleOutputSchema,
        },
        async (
            args: z.infer<typeof getProjectScheduleInputSchema>,
            ctx: ServerContext,
        ): Promise<CallToolResult> => {
            const token = ctx.http?.authInfo?.token;
            if (!token) return missingTokenResult();

            const input = getProjectScheduleInputSchema.parse(args);
            try {
                const schedule = await fetchProjectSchedule(token, input.projectId);
                return successResult({ projectId: input.projectId, schedule });
            } catch (error) {
                return errorResult("Failed to fetch project schedule", error);
            }
        },
    );
}

function registerGetProjectCommentCapability(server: McpServer) {
    server.registerTool(
        "get-project-comment-capability",
        {
            title: "Get Project Comment Capability",
            description:
                "Check whether the current user can comment on a project and which roles they may use. Always call before insert-project-comment. Control users may use any of ceo|projectmanager|qa|financial|planning; signatories only their own role.",
            inputSchema: getProjectCommentCapabilityInputSchema,
            outputSchema: getProjectCommentCapabilityOutputSchema,
        },
        async (
            args: z.infer<typeof getProjectCommentCapabilityInputSchema>,
            ctx: ServerContext,
        ): Promise<CallToolResult> => {
            const token = ctx.http?.authInfo?.token;
            if (!token) return missingTokenResult();

            const input = getProjectCommentCapabilityInputSchema.parse(args);
            try {
                const result = await fetchProjectCommentCapability(token, input.projectId);
                return successResult(result);
            } catch (error) {
                return errorResult("Failed to resolve comment capability", error);
            }
        },
    );
}

function registerInsertProjectComment(server: McpServer) {
    server.registerTool(
        "insert-project-comment",
        {
            title: "Insert Project Comment",
            description:
                "Write a manager/signatory comment on a project (Project/InsertProjectDesc). Server enforces Portal role rules: only ControlProject users or assigned signatories may comment; non-control users cannot comment as another role. Returns 403 when not allowed.",
            inputSchema: insertProjectCommentInputSchema,
            outputSchema: insertProjectCommentOutputSchema,
        },
        async (
            args: z.infer<typeof insertProjectCommentInputSchema>,
            ctx: ServerContext,
        ): Promise<CallToolResult> => {
            const token = ctx.http?.authInfo?.token;
            if (!token) return missingTokenResult();

            const input = insertProjectCommentInputSchema.parse(args);
            try {
                const result = await insertProjectComment(token, {
                    projectId: input.projectId,
                    description: input.description,
                    status: input.status,
                    commentAsRole: input.commentAsRole,
                });
                return successResult(result);
            } catch (error) {
                return errorResult("Failed to insert project comment", error);
            }
        },
    );
}

function registerUpdateProjectStatus(server: McpServer) {
    server.registerTool(
        "update-project-status",
        {
            title: "Update Project Status",
            description:
                "Update a project's lifecycle status (Project/UpdateProjectStatus). Allowed only when Portal's ControlProject feature flag matches (same gate as manageproject UI). Returns 403 when disabled.",
            inputSchema: updateProjectStatusInputSchema,
            outputSchema: updateProjectStatusOutputSchema,
        },
        async (
            args: z.infer<typeof updateProjectStatusInputSchema>,
            ctx: ServerContext,
        ): Promise<CallToolResult> => {
            const token = ctx.http?.authInfo?.token;
            if (!token) return missingTokenResult();

            const input = updateProjectStatusInputSchema.parse(args);
            try {
                const result = await updateProjectStatus(token, {
                    projectId: input.projectId,
                    statusId: input.statusId,
                });
                return successResult(result);
            } catch (error) {
                return errorResult("Failed to update project status", error);
            }
        },
    );
}

export function registerManageProjectTools(server: McpServer) {
    registerGetManageProjects(server);
    registerGetManageProject(server);
    registerGetProjectSchedule(server);
    registerGetProjectCommentCapability(server);
    registerInsertProjectComment(server);
    registerUpdateProjectStatus(server);
}
