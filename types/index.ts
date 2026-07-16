import type { Icon, StandardSchemaWithJSON, ToolAnnotations } from "@modelcontextprotocol/server";
import type { Request } from "express";
import type { ZodSchema } from "zod";

export interface IExtendedRequest extends Request {
    sessionMcpId?: string;
    lastEventId?: string;
}

export type TToolConfig = {
    title?: string;
    description?: string;
    inputSchema?: any;
    outputSchema?:any;
    annotations?: ToolAnnotations;
    icons?: Icon[];
    _meta?: Record<string, unknown>;
};
