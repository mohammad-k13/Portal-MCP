import type { McpServer, ServerContext } from "@modelcontextprotocol/server";

const MANAGE_PROJECT_OVERVIEW = `# Portal Manage Project (مدیریت پروژه)

Project list, manager sign-off comments, status updates, schedule, and SCurve —
mirrors \`/dashboard/project/manageproject\`.

## Recommended agent workflow

1. Call \`get-manage-projects\` — returns projects + \`commentCapability\` per row +
   \`canEditProjectStatus\`.
2. For one project: \`get-manage-project\` (\`projectId\`).
3. Before writing a comment: \`get-project-comment-capability\` (or use capability
   already on the list item). **Never assume** the user may comment.
4. If \`canComment\`:
   - Control users: pass \`commentAsRole\` (\`ceo\` | \`projectmanager\` | \`qa\` |
     \`financial\` | \`planning\`) to \`insert-project-comment\`.
   - Signatories: omit \`commentAsRole\` (server forces their own role). Passing
     another role returns **403**.
5. Status changes: only when \`canEditProjectStatus\` is true → \`update-project-status\`.
6. Schedule: \`get-project-schedule\`. Reports: see \`project://docs/reports\`.

## Tools

| Tool | Access | Purpose |
|------|--------|---------|
| \`get-manage-projects\` | read | List + init (statuses, capability) |
| \`get-manage-project\` | read | One project + comments |
| \`get-project-schedule\` | read | Activities / schedule |
| \`get-project-comment-capability\` | read | Who may comment / which roles |
| \`insert-project-comment\` | **gated write** | \`Project/InsertProjectDesc\` |
| \`update-project-status\` | **gated write** | \`Project/UpdateProjectStatus\` |

## Comment access (server-enforced)

\`canComment = isControlProjectUser || assignedSignatoryRole\`

**ControlProject** if any of:
- \`xIsEditWithControlProject\` on the project
- user id listed in setting \`ControlProject\`
- user assigned in \`xReferToUserIds\` with a ControlProject role code

Control users may comment **as any** of the five roles.
Other signatories (CEO, PM, QA, financial, planning) only as themselves.

Unauthorized \`insert-project-comment\` → **403**.

## Status edit gate

Same as Portal UI: enabled only when
\`String(controlProjectTypeId) === String(ControlProject setting)\`.

## Related

- Project progress reports → \`project://docs/reports\`
- Cartable inbox → \`cartable://docs/overview\` (entityType 7 = گزارش پروژه)
`;

export function registerManageProjectResources(server: McpServer) {
    server.registerResource(
        "manage-project-overview",
        "project://docs/manage",
        {
            title: "Manage Project Overview",
            description:
                "How Portal manageproject works and role-gated MCP tools for comments/status",
            mimeType: "text/markdown",
        },
        async (uri: URL, _ctx: ServerContext) => ({
            contents: [
                {
                    uri: uri.href,
                    mimeType: "text/markdown",
                    text: MANAGE_PROJECT_OVERVIEW,
                },
            ],
        }),
    );
}
