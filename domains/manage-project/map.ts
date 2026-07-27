import {
    COMMENT_ROLE_TYPES,
    getReferPairs,
    type CommentCapability,
    type CommentRoleType,
} from "../shared/project-permissions";
import {
    apiManageProjectSchema,
    apiScheduleItemSchema,
    apiSCurvePointSchema,
    type ApiManageProject,
    type ManageProject,
} from "./schema";

const ROLE_LABELS: Record<CommentRoleType, string> = {
    ceo: "مدیرعامل",
    projectmanager: "مدیر پروژه",
    qa: "مدیر تضمین کیفیت",
    financial: "مدیر مالی",
    planning: "مدیر طرح و برنامه",
};

export function portalUrlForProjectPassport(projectId: number): string {
    return `/dashboard/project/addproject?modes=show&projectID=${projectId}`;
}

function mapManagerComments(raw: ApiManageProject) {
    return COMMENT_ROLE_TYPES.map(roleType => {
        switch (roleType) {
            case "ceo":
                return {
                    roleType,
                    roleLabel: ROLE_LABELS.ceo,
                    comment: raw.xCEODesc,
                    status: raw.xCEOStatus ?? null,
                    fullName: raw.xCEODescFullname,
                };
            case "projectmanager":
                return {
                    roleType,
                    roleLabel: ROLE_LABELS.projectmanager,
                    comment: raw.xProjectManagerDesc,
                    status: raw.xProjectManagerStatus ?? null,
                    fullName: raw.xProjectManagerDescFullname,
                };
            case "qa":
                return {
                    roleType,
                    roleLabel: ROLE_LABELS.qa,
                    comment: raw.xQAManagerDesc,
                    status: raw.xQAManagerStatus ?? null,
                    fullName: raw.xQAManagerDescFullname,
                };
            case "financial":
                return {
                    roleType,
                    roleLabel: ROLE_LABELS.financial,
                    comment: raw.xFinancialManagerDesc,
                    status: raw.xFinancialManagerStatus ?? null,
                    fullName: raw.xFinancialManagerDescFullname,
                };
            case "planning":
                return {
                    roleType,
                    roleLabel: ROLE_LABELS.planning,
                    comment: raw.xPlanningManagerDesc,
                    status: raw.xPlanningManagerStatus ?? null,
                    fullName: raw.xPlanningManagerDescFullname,
                };
        }
    });
}

export function mapManageProject(
    raw: ApiManageProject,
    capability?: CommentCapability,
): ManageProject {
    return {
        projectId: raw.xProjectId_pk,
        title: raw.xProjectTitle,
        code: raw.xProjectCode,
        description: raw.xProjectDescription,
        startDate: raw.xStartDateFa,
        endDate: raw.xEndDateFa,
        statusTitle: raw.xProjectStatusTitle,
        statusTypeId: raw.xProjectStatusTypeId_fk,
        totalBudget: raw.xTotalBudget,
        projectManager: raw.xProjectManagerFullname,
        supervisor1: raw.xSupervisor1Fullname,
        supervisor2: raw.xSupervisor2Fullname,
        finalConfirm: raw.xFinalConfirm,
        isEditWithControlProject: raw.xIsEditWithControlProject,
        isReferred: raw.xIsReffer,
        referDate: raw.xReferDateFa,
        reportingPeriodDay: raw.xReportingPeriodDay,
        registerDate: raw.xRegisterDateFa,
        elapsedTimePercent: raw.xElapsedTimePercent,
        realPercent: raw.xRealPercentAll,
        plannedPercent: raw.xPlanedPercentAll,
        presentSituation: raw.xPresentSituation,
        goalSituation: raw.xGoalSituation,
        lastReportDescription: raw.xLastReportDescription,
        referPairs: getReferPairs(raw.xReferToUserIds),
        managerComments: mapManagerComments(raw),
        portalUrl: portalUrlForProjectPassport(raw.xProjectId_pk),
        commentCapability: capability
            ? {
                  canComment: capability.canComment,
                  isControlProjectUser: capability.isControlProjectUser,
                  userRoleInfo: capability.userRoleInfo,
                  allowedCommentRoles: capability.allowedCommentRoles,
              }
            : undefined,
    };
}

export function parseApiManageProjects(raw: unknown[]): ApiManageProject[] {
    return raw.flatMap(item => {
        const parsed = apiManageProjectSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
    });
}

export function mapSCurvePoints(raw: unknown[]) {
    return raw.flatMap(item => {
        const parsed = apiSCurvePointSchema.safeParse(item);
        if (!parsed.success) return [];
        const p = parsed.data;
        return [
            {
                projectId: p.xProjectId_fk,
                actualPercent: p.xSumActualPercent,
                actualAmount: p.xSumActualAmount,
                plannedPercent: p.xSumPlanedPercent,
                plannedAmount: p.xSumPlanedAmount,
                reportDateTo: p.xReportDateTo,
            },
        ];
    });
}

export function mapScheduleItems(raw: unknown[]) {
    return raw.flatMap(item => {
        const parsed = apiScheduleItemSchema.safeParse(item);
        if (!parsed.success) return [];
        const s = parsed.data;
        return [
            {
                scheduleId: s.xProjectScheduleId_pk,
                projectId: s.xProjectId_fk,
                activityTitle: s.xActivityTitle,
                startDate: s.xActivityStartDateFa,
                endDate: s.xActivityEndDateFa,
                cost: s.xActivityCost,
                weight: s.xActivityWeight,
                responderFullName: s.xResponderUserFullname,
                isActive: s.xIsActive,
                description: s.xDescription,
            },
        ];
    });
}
