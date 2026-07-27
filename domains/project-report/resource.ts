import type { McpServer, ServerContext } from "@modelcontextprotocol/server";

const PROJECT_REPORTS_OVERVIEW = `# Portal Project Reports (گزارشات ارسالی پروژه)

Periodic project progress reports: amounts, plan vs actual %, confirm status,
activity details, and read-only comments.

## Recommended agent workflow

1. Inbox entry (optional): \`get-cartable-titles\` → find **گزارش پروژه** (\`entityTypeId\` **7**).
2. \`get-cartable-list\` with that id → each item has a \`portalUrl\` like
   \`/dashboard/project/projectreportlist?projectId={id}\`.
3. Call \`get-project-reports\` with that \`projectId\` (or omit it to list broadly).
4. For one report's activities/comments: \`get-project-report\` with \`projectReportId\`
   (pass \`projectId\` when known).
5. Control users only: \`update-project-report-plans\` to save planned amounts.

## Tools

| Tool | Purpose |
|------|---------|
| \`get-project-reports\` | List reports (+ optional extras) |
| \`get-project-report\` | One report with details + comments |
| \`update-project-report-plans\` | Write planned amounts (ControlProject) |

## Field notes

- \`confirmStatus\`: \`approved\` / \`rejected\` / \`pending\` (from \`xIsConfirm\`)
- \`portalUrl\`: Next.js route for the report list filtered by project
- Create / approve / comment-on-report are **not** exposed (no Portal UI API yet)

## Related but separate

- Manage project / signatory comments → \`project://docs/manage\`
- Cartable **اظهار نظر گزارش پروژه** (entityType 8) → not wired here
`;

export function registerProjectReportResources(server: McpServer) {
    server.registerResource(
        "project-reports-overview",
        "project://docs/reports",
        {
            title: "Project Reports Overview",
            description:
                "How Portal project reports work and how to use the project-report MCP tools with cartable",
            mimeType: "text/markdown",
        },
        async (uri: URL, _ctx: ServerContext) => ({
            contents: [
                {
                    uri: uri.href,
                    mimeType: "text/markdown",
                    text: PROJECT_REPORTS_OVERVIEW,
                },
            ],
        }),
    );
}
