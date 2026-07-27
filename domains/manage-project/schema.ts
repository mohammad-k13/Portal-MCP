import { z } from "zod/v4";

export const commentRoleTypeSchema = z.enum([
    "ceo",
    "projectmanager",
    "qa",
    "financial",
    "planning",
]);

/** Raw manage-project row from BFF / Project/GetAllForManage (subset we care about). */
export const apiManageProjectSchema = z
    .object({
        xProjectId_pk: z.number(),
        xProjectTitle: z.string().nullish().transform(v => v ?? ""),
        xProjectCode: z.string().nullish().transform(v => v ?? ""),
        xProjectDescription: z.string().nullish().transform(v => v ?? ""),
        xStartDateFa: z.string().nullish().transform(v => v ?? ""),
        xEndDateFa: z.string().nullish().transform(v => v ?? ""),
        xTotalBudget: z.number().nullish().transform(v => v ?? 0),
        xReferToUserIds: z.string().nullish().transform(v => v ?? ""),
        xProjectStatusTitle: z.string().nullish().transform(v => v ?? ""),
        xProjectStatusTypeId_fk: z.number().nullish().transform(v => v ?? 0),
        xProjectManagerFullname: z.string().nullish().transform(v => v ?? ""),
        xSupervisor1Fullname: z.string().nullish().transform(v => v ?? ""),
        xSupervisor2Fullname: z.string().nullish().transform(v => v ?? ""),
        xFinalConfirm: z.boolean().nullish().transform(v => v ?? false),
        xIsEditWithControlProject: z.boolean().nullish().transform(v => v ?? false),
        xIsReffer: z.boolean().nullish().transform(v => v ?? false),
        xReferDateFa: z.string().nullish().transform(v => v ?? ""),
        xReportingPeriodDay: z.number().nullish().transform(v => v ?? 0),
        xRegisterDateFa: z.string().nullish().transform(v => v ?? ""),
        xElapsedTimePercent: z.number().nullish().transform(v => v ?? 0),
        xRealPercentAll: z.number().nullish().transform(v => v ?? 0),
        xPlanedPercentAll: z.number().nullish().transform(v => v ?? 0),
        xProjectManagerDesc: z.string().nullish().transform(v => v ?? ""),
        xQAManagerDesc: z.string().nullish().transform(v => v ?? ""),
        xPlanningManagerDesc: z.string().nullish().transform(v => v ?? ""),
        xFinancialManagerDesc: z.string().nullish().transform(v => v ?? ""),
        xCEODesc: z.string().nullish().transform(v => v ?? ""),
        xProjectManagerStatus: z.boolean().nullable().optional(),
        xQAManagerStatus: z.boolean().nullable().optional(),
        xPlanningManagerStatus: z.boolean().nullable().optional(),
        xFinancialManagerStatus: z.boolean().nullable().optional(),
        xCEOStatus: z.boolean().nullable().optional(),
        xProjectManagerDescFullname: z.string().nullish().transform(v => v ?? ""),
        xQAManagerDescFullname: z.string().nullish().transform(v => v ?? ""),
        xPlanningManagerDescFullname: z.string().nullish().transform(v => v ?? ""),
        xFinancialManagerDescFullname: z.string().nullish().transform(v => v ?? ""),
        xCEODescFullname: z.string().nullish().transform(v => v ?? ""),
        xProjectManagerUserId_fk: z.number().nullish().transform(v => v ?? 0),
        xPresentSituation: z.string().nullish().transform(v => v ?? ""),
        xGoalSituation: z.string().nullish().transform(v => v ?? ""),
        xLastReportDescription: z.string().nullish().transform(v => v ?? ""),
    })
    .passthrough();

export const apiSignatoryRoleSchema = z.object({
    xCode: z.string(),
    xTypeTitle: z.string().nullish().transform(v => v ?? ""),
    xTypeId_pk: z.number().optional(),
});

export const apiProjectStatusOptionSchema = z.object({
    value: z.string(),
    label: z.string(),
    typeId: z.number(),
});

export const apiSCurvePointSchema = z.object({
    xProjectId_fk: z.number().nullish().transform(v => v ?? 0),
    xSumActualPercent: z.number().nullish().transform(v => v ?? 0),
    xSumActualAmount: z.number().nullish().transform(v => v ?? 0),
    xSumPlanedPercent: z.number().nullish().transform(v => v ?? 0),
    xSumPlanedAmount: z.number().nullish().transform(v => v ?? 0),
    xReportDateTo: z.string().nullish().transform(v => v ?? ""),
});

export const apiScheduleItemSchema = z.object({
    xProjectScheduleId_pk: z.number(),
    xProjectId_fk: z.number(),
    xActivityTitle: z.string().nullish().transform(v => v ?? ""),
    xActivityStartDateFa: z.string().nullish().transform(v => v ?? ""),
    xActivityEndDateFa: z.string().nullish().transform(v => v ?? ""),
    xActivityCost: z.number().nullish().transform(v => v ?? 0),
    xActivityWeight: z.number().nullish().transform(v => v ?? 0),
    xResponderUserFullname: z.string().nullish().transform(v => v ?? ""),
    xIsActive: z.boolean().nullish().transform(v => v ?? true),
    xDescription: z.string().nullish().transform(v => v ?? ""),
});

export const userRoleInfoSchema = z.object({
    roleCode: z.string(),
    roleType: commentRoleTypeSchema,
    roleLabel: z.string(),
    lastComment: z.string(),
    status: z.boolean().nullable(),
});

export const commentCapabilitySchema = z.object({
    canComment: z.boolean(),
    isControlProjectUser: z.boolean(),
    userRoleInfo: userRoleInfoSchema.nullable(),
    allowedCommentRoles: z.array(commentRoleTypeSchema),
});

export const managerCommentSchema = z.object({
    roleType: commentRoleTypeSchema,
    roleLabel: z.string(),
    comment: z.string(),
    status: z.boolean().nullable(),
    fullName: z.string(),
});

export const referPairSchema = z.object({
    roleCode: z.string(),
    userId: z.number(),
});

export const manageProjectSchema = z.object({
    projectId: z.number(),
    title: z.string(),
    code: z.string(),
    description: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    statusTitle: z.string(),
    statusTypeId: z.number(),
    totalBudget: z.number(),
    projectManager: z.string(),
    supervisor1: z.string(),
    supervisor2: z.string(),
    finalConfirm: z.boolean(),
    isEditWithControlProject: z.boolean(),
    isReferred: z.boolean(),
    referDate: z.string(),
    reportingPeriodDay: z.number(),
    registerDate: z.string(),
    elapsedTimePercent: z.number(),
    realPercent: z.number(),
    plannedPercent: z.number(),
    presentSituation: z.string(),
    goalSituation: z.string(),
    lastReportDescription: z.string(),
    referPairs: z.array(referPairSchema),
    managerComments: z.array(managerCommentSchema),
    portalUrl: z.string(),
    commentCapability: commentCapabilitySchema.optional(),
});

export const sCurvePointSchema = z.object({
    projectId: z.number(),
    actualPercent: z.number(),
    actualAmount: z.number(),
    plannedPercent: z.number(),
    plannedAmount: z.number(),
    reportDateTo: z.string(),
});

export const scheduleItemSchema = z.object({
    scheduleId: z.number(),
    projectId: z.number(),
    activityTitle: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    cost: z.number(),
    weight: z.number(),
    responderFullName: z.string(),
    isActive: z.boolean(),
    description: z.string(),
});

export const projectStatusOptionSchema = z.object({
    value: z.string(),
    label: z.string(),
    typeId: z.number(),
});

/** Tool I/O */

export const getManageProjectsInputSchema = z.object({
    fromDateFa: z.string().optional().describe("Persian from date filter"),
    toDateFa: z.string().optional().describe("Persian to date filter"),
    includeSCurve: z
        .boolean()
        .optional()
        .default(false)
        .describe("If true, include SCurve series per project (large)"),
    includeCapability: z
        .boolean()
        .optional()
        .default(true)
        .describe("If true, attach commentCapability for the current user on each project"),
});

export const getManageProjectsOutputSchema = z.object({
    projects: z.array(manageProjectSchema),
    projectStatuses: z.array(projectStatusOptionSchema),
    controlProjectTypeId: z.number().nullable(),
    canEditProjectStatus: z.boolean(),
    projectsSCurve: z
        .array(
            z.object({
                projectId: z.number(),
                points: z.array(sCurvePointSchema),
            }),
        )
        .optional(),
});

export const getManageProjectInputSchema = z.object({
    projectId: z.number().int().positive(),
    includeSCurve: z.boolean().optional().default(false),
});

export const getManageProjectOutputSchema = z.object({
    project: manageProjectSchema,
    projectStatuses: z.array(projectStatusOptionSchema),
    controlProjectTypeId: z.number().nullable(),
    canEditProjectStatus: z.boolean(),
    sCurve: z.array(sCurvePointSchema).optional(),
});

export const getProjectScheduleInputSchema = z.object({
    projectId: z.number().int().positive(),
});

export const getProjectScheduleOutputSchema = z.object({
    projectId: z.number(),
    schedule: z.array(scheduleItemSchema),
});

export const getProjectCommentCapabilityInputSchema = z.object({
    projectId: z.number().int().positive(),
});

export const getProjectCommentCapabilityOutputSchema = z.object({
    projectId: z.number(),
    capability: commentCapabilitySchema,
});

export const insertProjectCommentInputSchema = z.object({
    projectId: z.number().int().positive(),
    description: z.string().min(1).describe("Comment text (Desc)"),
    status: z.boolean().describe("Approval status for this role (true=approved, false=rejected)"),
    commentAsRole: commentRoleTypeSchema
        .optional()
        .describe(
            "Required for ControlProject users. Signatories must omit or match their own role.",
        ),
});

export const insertProjectCommentOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    projectId: z.number(),
    roleType: commentRoleTypeSchema,
    project: manageProjectSchema.optional(),
});

export const updateProjectStatusInputSchema = z.object({
    projectId: z.number().int().positive(),
    statusId: z.number().int().positive().describe("Project status type id / code value from projectStatuses"),
});

export const updateProjectStatusOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    projectId: z.number(),
    statusId: z.number(),
});

export type ApiManageProject = z.infer<typeof apiManageProjectSchema>;
export type ManageProject = z.infer<typeof manageProjectSchema>;
export type CommentCapabilityDto = z.infer<typeof commentCapabilitySchema>;
