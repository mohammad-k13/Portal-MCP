import type { McpServer, ServerContext } from "@modelcontextprotocol/server";

const CARTABLE_OVERVIEW = `# Portal Cartable (کارتابل)

Cartable is the user's inbox of pending work items, grouped by entity type
(letters, purchase requests, leave, projects, etc.).

## Recommended agent workflow

1. Call tool \`get-cartable-titles\` — returns entity types with counts.
2. Pick an \`entityTypeId\` (usually where count > 0).
3. Call tool \`get-cartable-list\` with that id.
   - \`isExit: false\` (default) — items still open in the cartable
   - \`isExit: true\` — completed / exited items
4. Use \`portalUrl\` on each item when present to open the related Portal page.
   If \`portalUrl\` is null, only the legacy backend URL is available.

## Field notes

- \`entityTypeId\` — category of inbox items
- \`count\` — number of items in that category (from titles summary)
- \`isExit\` / item \`isExit\` — whether the item has left the cartable (done)
- \`portalUrl\` — mapped Next.js route inside Portal (may be null)
- \`legacyUrl\` — original backend \`xUrl\`

## Tools (not resources)

Live user inbox data is exposed only as tools, because it is authenticated,
parameterized, and changes often. This resource is static reference context.
`;

export function registerCartableResources(server: McpServer) {
    server.registerResource(
        "cartable-overview",
        "cartable://docs/overview",
        {
            title: "Cartable Overview",
            description: "How Portal cartable works and how to use the cartable MCP tools",
            mimeType: "text/markdown",
        },
        async (uri: URL, _ctx: ServerContext) => ({
            contents: [
                {
                    uri: uri.href,
                    mimeType: "text/markdown",
                    text: CARTABLE_OVERVIEW,
                },
            ],
        }),
    );
}
