import type { CallToolResult, McpServer, ServerContext } from "@modelcontextprotocol/server";
import { ApiRequestError } from "../../utils/axios";
import {
    cartableListInputSchema,
    cartableListOutputSchema,
    cartableTitlesOutputSchema,
} from "./schema";
import { fetchCartableList, fetchCartableTitles } from "./services";
import { z } from "zod/v4";

const emptyInputSchema = z.object({});

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

function registerGetCartableTitles(server: McpServer) {
    server.registerTool(
        "get-cartable-titles",
        {
            title: "Get Cartable Titles",
            description:
                "Get the authenticated user's cartable (inbox) summary: entity types with pending item counts. Call this first to discover entityTypeId values, then use get-cartable-list.",
            inputSchema: emptyInputSchema,
            outputSchema: cartableTitlesOutputSchema,
        },
        async (_args, ctx: ServerContext): Promise<CallToolResult> => {
            const token = ctx.http?.authInfo?.token;
            if (!token) return missingTokenResult();

            try {
                const titles = await fetchCartableTitles(token);
                const output = { titles };
                return {
                    content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
                    structuredContent: output,
                };
            } catch (error) {
                return errorResult("Failed to fetch cartable titles", error);
            }
        },
    );
}

function registerGetCartableList(server: McpServer) {
    server.registerTool(
        "get-cartable-list",
        {
            title: "Get Cartable List",
            description:
                "Get cartable (inbox) items for a specific entity type. Use entityTypeId from get-cartable-titles. Default isExit=false returns open items still in the cartable; isExit=true returns completed items.",
            inputSchema: cartableListInputSchema,
            outputSchema: cartableListOutputSchema,
        },
        async (
            args: z.infer<typeof cartableListInputSchema>,
            ctx: ServerContext,
        ): Promise<CallToolResult> => {
            const token = ctx.http?.authInfo?.token;
            if (!token) return missingTokenResult();

            const { entityTypeId, isExit } = cartableListInputSchema.parse(args);

            try {
                const items = await fetchCartableList(token, { entityTypeId, isExit });
                const output = { entityTypeId, isExit, items };
                return {
                    content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
                    structuredContent: output,
                };
            } catch (error) {
                return errorResult("Failed to fetch cartable list", error);
            }
        },
    );
}

export function registerCartableTools(server: McpServer) {
    registerGetCartableTitles(server);
    registerGetCartableList(server);
}
