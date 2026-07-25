import type {
  CallToolResult,
  McpServer,
  ServerContext,
} from "@modelcontextprotocol/server";
import { ApiRequestError } from "../../utils/axios";
import {
  cartableAllListsInputSchema,
  cartableAllListsOutputSchema,
  cartableListInputSchema,
  cartableListOutputSchema,
  cartableTitlesOutputSchema,
} from "./schema";
import {
  fetchAllCartableLists,
  fetchCartableList,
  fetchCartableTitles,
} from "./services";
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

function successResult(output: Record<string, unknown>): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
    structuredContent: output,
  };
}

function registerGetCartableTitles(server: McpServer) {
  server.registerTool(
    "get-cartable-titles",
    {
      title: "Get Cartable Titles",
      description:
        "Step 1: Get cartable categories (entity types) with pending counts and entityTypeId. Use this first to discover whether items are project reports, finance, documents, etc. Then call get-cartable-list with a chosen entityTypeId, or get-all-cartable-lists for every category.",
      inputSchema: emptyInputSchema,
      outputSchema: cartableTitlesOutputSchema,
    },
    async (_args, ctx: ServerContext): Promise<CallToolResult> => {
      const token = ctx.http?.authInfo?.token;
      if (!token) return missingTokenResult();

      try {
        const titles = await fetchCartableTitles(token);
        return successResult({ titles });
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
        "Step 2: Get cartable items for ONE entityTypeId from get-cartable-titles (e.g. project reports). isExit: false=open, true=done, \"all\"=both.",
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
        return successResult({ entityTypeId, isExit, items });
      } catch (error) {
        return errorResult("Failed to fetch cartable list", error);
      }
    },
  );
}

function registerGetAllCartableLists(server: McpServer) {
  server.registerTool(
    "get-all-cartable-lists",
    {
      title: "Get All Cartable Lists",
      description:
        "Fetch cartable items for ALL entity types in one call. Resolves entityTypeIds via titles, then returns groups[{ entityTypeId, title, count, items }]. Prefer this when the user wants the full inbox across categories. For a single category use get-cartable-list. isExit: false=open, true=done, \"all\"=both. Warning: large inboxes (e.g. many documents) can be slow/huge.",
      inputSchema: cartableAllListsInputSchema,
      outputSchema: cartableAllListsOutputSchema,
    },
    async (
      args: z.infer<typeof cartableAllListsInputSchema>,
      ctx: ServerContext,
    ): Promise<CallToolResult> => {
      const token = ctx.http?.authInfo?.token;
      if (!token) return missingTokenResult();

      const { isExit, onlyWithCount } = cartableAllListsInputSchema.parse(args);

      try {
        const groups = await fetchAllCartableLists(token, { isExit, onlyWithCount });
        return successResult({ isExit, groups });
      } catch (error) {
        return errorResult("Failed to fetch all cartable lists", error);
      }
    },
  );
}

export function registerCartableTools(server: McpServer) {
  registerGetCartableTitles(server);
  registerGetCartableList(server);
  registerGetAllCartableLists(server);
}
