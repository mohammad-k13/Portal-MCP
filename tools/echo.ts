import type { CallToolResult, McpServer, ServerContext } from "@modelcontextprotocol/server";
import type { TToolConfig } from "../types";
import { z } from "zod/v4";

const name = "echo";
const inputSchema = z.object({
    message: z.string().min(1).describe("The message for echo"),
});
const config: TToolConfig = {
    title: "Echo Message",
    description: "Echo the input",
    inputSchema,
};
export default function createEchoTool(server: McpServer) {
    server.registerTool(
        name,
        config,
        async (
            args: z.infer<typeof inputSchema>,
            ctx: ServerContext,
        ): Promise<CallToolResult> => {
            const { message: text } = inputSchema.parse(args);

            if (!text)
                return {
                    content: [
                        {
                            type: "text",
                            text: "The message is required",
                        },
                    ],
                    isError: true,
                };

            return { content: [{ type: "text", text }] };
        },
    );
}
