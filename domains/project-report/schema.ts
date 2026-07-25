import { z } from "zod/v4";

/** Raw report row from Portal BFF `/dashboard/project/projectreportlist/api/project-reports`. */
export const apiProjectReportSchema = z.object({
    xProjectReportId_pk: z.string(),
    xProjectId_fk: z.number(),
    xReportDateFrom: z.string().nullish().transform(v => v ?? ""),
    xProjectTitle: z.string().nullish().transform(v => v ?? ""),
    xReportDateTo: z.string().nullish().transform(v => v ?? ""),
    xMaterialAmount: z.number().nullish().transform(v => v ?? 0),
    xManAmount: z.number().nullish().transform(v => v ?? 0),
    xMachineAmount: z.number().nullish().transform(v => v ?? 0),
    xContractorAmount: z.number().nullish().transform(v => v ?? 0),
    xReasonDeviation: z.string().nullish().transform(v => v ?? ""),
    xReportDescription: z.string().nullish().transform(v => v ?? ""),
    xRegisterDateFa: z.string().nullish().transform(v => v ?? ""),
    xConfirmTitle: z.string().nullish().transform(v => v ?? ""),
    xConfirmDateFa: z.string().nullish().transform(v => v ?? ""),
    xConfirmDescription: z.string().nullish().transform(v => v ?? ""),
    xIsConfirm: z.boolean().nullable().optional(),
    xConfirmUserId_fk: z.number().nullish().transform(v => v ?? 0),
    xPlanMaterialAmount: z.number().nullish().transform(v => v ?? 0),
    xPlanMachineAmount: z.number().nullish().transform(v => v ?? 0),
    xPlanManAmount: z.number().nullish().transform(v => v ?? 0),
    xPlanContractorAmount: z.number().nullish().transform(v => v ?? 0),
    xSumPlanedPercent: z.number().nullish().transform(v => v ?? 0),
    xSumActualPercent: z.number().nullish().transform(v => v ?? 0),
    details: z.array(z.unknown()).optional(),
    comments: z.array(z.unknown()).optional(),
});

export const apiProjectReportDetailSchema = z.object({
    xProjectReportDetailId_pk: z.string(),
    xProjectReportId_pk: z.string(),
    xProjectScheduleId_fk: z.number(),
    xActivityTitle: z.string().nullish().transform(v => v ?? ""),
    xActivityWeight: z.number().nullish().transform(v => v ?? 0),
    xProgressPercent: z.number().nullish().transform(v => v ?? 0),
    xReportDetailDescription: z.string().nullish().transform(v => v ?? ""),
    xReportDateFrom: z.string().nullish().transform(v => v ?? ""),
    xReportDateTo: z.string().nullish().transform(v => v ?? ""),
});

export const apiProjectReportCommentSchema = z.object({
    xFullname: z.string().nullish().transform(v => v ?? ""),
    xCommenterTypeTitle: z.string().nullish().transform(v => v ?? ""),
    xComment: z.string().nullish().transform(v => v ?? ""),
    xRegisterDateFa: z.string().nullish().transform(v => v ?? ""),
    xLastModifiedDateFa: z.string().nullish().transform(v => v ?? ""),
});

export const confirmStatusSchema = z
    .enum(["all", "approved", "rejected", "pending"])
    .optional()
    .default("all")
    .describe("Filter by confirm status (client-side, mirrors Portal UI)");

export const projectReportDetailSchema = z.object({
    detailId: z.string(),
    reportId: z.string(),
    scheduleId: z.number(),
    activityTitle: z.string(),
    activityWeight: z.number(),
    progressPercent: z.number(),
    description: z.string(),
    dateFrom: z.string(),
    dateTo: z.string(),
});

export const projectReportCommentSchema = z.object({
    fullName: z.string(),
    commenterType: z.string(),
    comment: z.string(),
    registerDate: z.string(),
    lastModifiedDate: z.string(),
});

/** LLM-safe project report summary. */
export const projectReportSchema = z.object({
    reportId: z.string(),
    projectId: z.number(),
    projectTitle: z.string(),
    dateFrom: z.string(),
    dateTo: z.string(),
    registerDate: z.string(),
    confirmStatus: z.enum(["approved", "rejected", "pending"]),
    confirmTitle: z.string(),
    confirmDate: z.string(),
    confirmDescription: z.string(),
    planPercent: z.number(),
    actualPercent: z.number(),
    reasonDeviation: z.string(),
    reportDescription: z.string(),
    amounts: z.object({
        material: z.number(),
        man: z.number(),
        machine: z.number(),
        contractor: z.number(),
    }),
    planAmounts: z.object({
        material: z.number(),
        man: z.number(),
        machine: z.number(),
        contractor: z.number(),
    }),
    portalUrl: z.string(),
});

export const projectReportWithExtrasSchema = projectReportSchema.extend({
    details: z.array(projectReportDetailSchema),
    comments: z.array(projectReportCommentSchema),
});

export const getProjectReportsInputSchema = z.object({
    projectId: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("When set, list reports for this project only"),
    fromDate: z.string().optional().describe("Persian from date filter (list-all mode)"),
    toDate: z.string().optional().describe("Persian to date filter (list-all mode)"),
    query: z.string().optional().describe("Text search (list-all mode)"),
    unitId: z.string().optional(),
    strategyId: z.string().optional(),
    statusIds: z.array(z.string()).optional().describe("Project status ids; default 1-5"),
    confirmStatus: confirmStatusSchema,
    includeExtras: z
        .boolean()
        .optional()
        .default(false)
        .describe("If true, include activity details and comments per report (larger payload)"),
});

export const getProjectReportsOutputSchema = z.object({
    reports: z.array(projectReportWithExtrasSchema),
});

export const getProjectReportInputSchema = z.object({
    projectReportId: z.string().describe("Project report id (xProjectReportId_pk)"),
    projectId: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Optional project id to resolve the report faster via BFF"),
});

export const getProjectReportOutputSchema = z.object({
    report: projectReportWithExtrasSchema,
});

export const updateProjectReportPlansInputSchema = z.object({
    projectReportId: z.string().min(1),
    projectId: z.number().int().positive().describe("Project id owning the report"),
    planMaterialAmount: z.number(),
    planManAmount: z.number(),
    planMachineAmount: z.number(),
    planContractorAmount: z.number(),
});

export const updateProjectReportPlansOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    reportId: z.string(),
});

export type ApiProjectReport = z.infer<typeof apiProjectReportSchema>;
export type ProjectReport = z.infer<typeof projectReportSchema>;
export type ProjectReportWithExtras = z.infer<typeof projectReportWithExtrasSchema>;
export type ConfirmStatus = "approved" | "rejected" | "pending";
