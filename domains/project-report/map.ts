import {
    apiProjectReportCommentSchema,
    apiProjectReportDetailSchema,
    apiProjectReportSchema,
    type ApiProjectReport,
    type ConfirmStatus,
    type ProjectReportWithExtras,
} from "./schema";

export function confirmStatusFromApi(isConfirm: boolean | null | undefined): ConfirmStatus {
    if (isConfirm === true) return "approved";
    if (isConfirm === false) return "rejected";
    return "pending";
}

export function matchesConfirmStatus(
    isConfirm: boolean | null | undefined,
    filter: "all" | ConfirmStatus,
): boolean {
    if (filter === "all") return true;
    return confirmStatusFromApi(isConfirm) === filter;
}

export function portalUrlForProject(projectId: number): string {
    return `/dashboard/project/projectreportlist?projectId=${projectId}`;
}

function mapDetails(raw: unknown[] | undefined) {
    if (!raw?.length) return [];
    return raw.flatMap(item => {
        const parsed = apiProjectReportDetailSchema.safeParse(item);
        if (!parsed.success) return [];
        const d = parsed.data;
        return [
            {
                detailId: d.xProjectReportDetailId_pk,
                reportId: d.xProjectReportId_pk,
                scheduleId: d.xProjectScheduleId_fk,
                activityTitle: d.xActivityTitle,
                activityWeight: d.xActivityWeight,
                progressPercent: d.xProgressPercent,
                description: d.xReportDetailDescription,
                dateFrom: d.xReportDateFrom,
                dateTo: d.xReportDateTo,
            },
        ];
    });
}

function mapComments(raw: unknown[] | undefined) {
    if (!raw?.length) return [];
    return raw.flatMap(item => {
        const parsed = apiProjectReportCommentSchema.safeParse(item);
        if (!parsed.success) return [];
        const c = parsed.data;
        return [
            {
                fullName: c.xFullname,
                commenterType: c.xCommenterTypeTitle,
                comment: c.xComment,
                registerDate: c.xRegisterDateFa,
                lastModifiedDate: c.xLastModifiedDateFa,
            },
        ];
    });
}

export function mapProjectReport(
    raw: ApiProjectReport,
    includeExtras: boolean,
): ProjectReportWithExtras {
    return {
        reportId: raw.xProjectReportId_pk,
        projectId: raw.xProjectId_fk,
        projectTitle: raw.xProjectTitle,
        dateFrom: raw.xReportDateFrom,
        dateTo: raw.xReportDateTo,
        registerDate: raw.xRegisterDateFa,
        confirmStatus: confirmStatusFromApi(raw.xIsConfirm),
        confirmTitle: raw.xConfirmTitle,
        confirmDate: raw.xConfirmDateFa,
        confirmDescription: raw.xConfirmDescription,
        planPercent: raw.xSumPlanedPercent,
        actualPercent: raw.xSumActualPercent,
        reasonDeviation: raw.xReasonDeviation,
        reportDescription: raw.xReportDescription,
        amounts: {
            material: raw.xMaterialAmount,
            man: raw.xManAmount,
            machine: raw.xMachineAmount,
            contractor: raw.xContractorAmount,
        },
        planAmounts: {
            material: raw.xPlanMaterialAmount,
            man: raw.xPlanManAmount,
            machine: raw.xPlanMachineAmount,
            contractor: raw.xPlanContractorAmount,
        },
        portalUrl: portalUrlForProject(raw.xProjectId_fk),
        details: includeExtras ? mapDetails(raw.details) : [],
        comments: includeExtras ? mapComments(raw.comments) : [],
    };
}

export function parseApiProjectReports(raw: unknown[]): ApiProjectReport[] {
    return raw.flatMap(item => {
        const parsed = apiProjectReportSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
    });
}
