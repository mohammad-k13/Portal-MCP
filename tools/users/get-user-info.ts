import type { CallToolResult, McpServer, ServerContext } from "@modelcontextprotocol/server";
import type { TToolConfig } from "../../types";
import { createInternalApiClient } from "../../utils/axios";
import { z } from "zod/v4";

const name = "get-user-info";

/** Fields safe to expose to the LLM — never include xToken. */
const userInfoSchema = z.object({
    userId: z.number(),
    companyId: z.number(),
    username: z.string(),
    fullName: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    personnelCode: z.string(),
    companyName: z.string(),
    mustChangePassword: z.boolean(),
});

type UserInfo = z.infer<typeof userInfoSchema>;

const apiUserSchema = z.object({
    xUserId_pk: z.number(),
    xCompanyId_fk: z.number(),
    xUsername: z.string(),
    xFullname: z.string(),
    xFirstName: z.string(),
    xLastName: z.string(),
    xPersonelCode: z.string(),
    xCompanyName: z.string(),
    xMustChangePassword: z.boolean(),
});

const config: TToolConfig = {
    title: "Get User Info",
    description: "Get the authenticated user's profile from the portal API",
    inputSchema: z.object({}),
    outputSchema: userInfoSchema,
};

function mapUser(data: z.infer<typeof apiUserSchema>): UserInfo {
    return {
        userId: data.xUserId_pk,
        companyId: data.xCompanyId_fk,
        username: data.xUsername,
        fullName: data.xFullname.trim(),
        firstName: data.xFirstName.trim(),
        lastName: data.xLastName.trim(),
        personnelCode: data.xPersonelCode,
        companyName: data.xCompanyName,
        mustChangePassword: data.xMustChangePassword,
    };
}

export default function getUserInfo(server: McpServer) {
    server.registerTool(
        name,
        config,
        async (_args, ctx: ServerContext): Promise<CallToolResult> => {
            const token = ctx.http?.authInfo?.token;
            if (!token) {
                return {
                    content: [{ type: "text", text: "Missing auth token." }],
                    isError: true,
                };
            }

            try {
                const internalApi = createInternalApiClient(token);
                const { data } = await internalApi.get("/api/user-information");

                const raw = data?.Data;
                if (!raw) {
                    return {
                        content: [{ type: "text", text: "No user information found." }],
                        isError: true,
                    };
                }

                const parsed = apiUserSchema.safeParse(raw);
                if (!parsed.success) {
                    return {
                        content: [{ type: "text", text: "Unexpected user-information response shape." }],
                        isError: true,
                    };
                }

                const user = mapUser(parsed.data);
                const text = JSON.stringify(user, null, 2);

                return {
                    content: [{ type: "text", text }],
                    structuredContent: user,
                };
            } catch (error) {
                const message = error instanceof Error ? error.message : "Request failed";
                return {
                    content: [{ type: "text", text: `Failed to fetch user info: ${message}` }],
                    isError: true,
                };
            }
        },
    );
}
