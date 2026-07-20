# Portal MCP

Portal MCP is a Model Context Protocol (MCP) server for connecting AI clients (like Cursor or MCP Inspector) to your Portal backend APIs.

It exposes Portal operations as MCP tools and returns safe, structured data to the model.

## What this project does

- Runs an MCP server over HTTP at `/mcp`
- Secures requests with Bearer auth
- Provides MCP tools for Portal data access
- Validates and transforms API responses before returning them
- Keeps HTTP client logic in reusable utility functions

## Current tools

- `echo`: returns the same message (health check and testing)
- `get-user-info`: fetches authenticated user profile from internal Portal API

## Tech stack

- Bun + TypeScript
- Express
- `@modelcontextprotocol/*` packages
- Axios
- Zod

## Project structure

- `index.ts`: HTTP app bootstrap and MCP route
- `server/index.ts`: MCP server creation and registration
- `tools/`: MCP tools
- `utils/axios.ts`: API client helpers and error handling
- `types/`: shared TypeScript types
- `domains/`: in-progress domain-first structure (cartable module)

## Environment variables

Copy `.env.example` to `.env` and set values:

```env
PORT=8080
PORTAL_MCP_TOKEN=your_token
PORTAL_API_URL=http://localhost:3001
REMOTE_PORTAL_API_URL=https://portal.hamgam-khodro.com:8089/api/
```

## Quick start (simple)

1. Install dependencies:

```bash
bun install
```

2. Start the server:

```bash
bun run dev
```

3. Server is available at:

`http://localhost:8080/mcp`

4. Test in MCP Inspector:

```bash
bun run inspect
```

Use Streamable HTTP transport with URL `http://localhost:8080/mcp` and send:

`Authorization: Bearer <PORTAL_MCP_TOKEN>`

## Cursor configuration note

For HTTP MCP servers, Cursor reads `${env:...}` from OS environment variables, not from project `.env`.

If you use this in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "portal-mcp": {
      "url": "http://localhost:8080/mcp",
      "headers": {
        "Authorization": "Bearer ${env:PORTAL_MCP_TOKEN}"
      }
    }
  }
}
```

make sure `PORTAL_MCP_TOKEN` is set in your system/user environment and restart Cursor.
