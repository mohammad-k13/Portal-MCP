import type { IExtendedRequest } from "../types";
import type { NextFunction, Request, Response } from "express";

// Extract session-mcp-id and last-event-id
export function extractSessionMcpId(req: Request, _res: Response, next: NextFunction) {
    const sessionMcpId = req.header("mcp-session-id");
    const lastEventId = req.header("last-event-id");

    (req as IExtendedRequest).sessionMcpId = sessionMcpId;
    (req as IExtendedRequest).lastEventId = lastEventId;

    next();
}
