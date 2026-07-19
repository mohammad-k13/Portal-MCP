import { createMcpExpressApp, requireBearerAuth } from "@modelcontextprotocol/express";
import { createMcpHandler } from "@modelcontextprotocol/server";
import createServer from "./server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import type { Request, Response } from "express";

const app = createMcpExpressApp({
    host: "0.0.0.0",
    allowedOrigins: ["*"],
    allowedHosts: ["localhost"],
});

const handler = createMcpHandler(createServer);
const node = toNodeHandler(handler);

app.all(
    "/mcp",
    requireBearerAuth({
        verifier: {
            async verifyAccessToken(token) {
                return {
                    token,
                    clientId: "portal",
                    scopes: ["mcp"],
                    expiresAt: Math.floor(Date.now() / 1000) + 3600,
                };
            },
        },
    }),
    (req: Request, res: Response) => void node(req, res, req.body),
);

app.listen(process.env.PORT || 8080, () => {
    console.log(`Server is running on port ${process.env.PORT || 8080}`);
});
