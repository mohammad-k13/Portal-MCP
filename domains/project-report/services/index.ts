import {
    ApiRequestError,
    createAuthenticatedPortalApiClient,
    createInternalApiClient,
} from "../../../utils/axios";
import { mapProjectReport, matchesConfirmStatus, parseApiProjectReports } from "../map";
import { isGlobalControlProjectUser } from "../permissions";
import type { ApiProjectReport, ConfirmStatus, ProjectReportWithExtras } from "../schema";
import { apiProjectReportSchema } from "../schema";

const PROJECT_REPORTS_BFF = "/dashboard/project/projectreportlist/api/project-reports";
const APPLICATION_ID = 2;

type BffFilters = {
    fromDate?: string;
    toDate?: string;
    query?: string;
    unitId?: string;
    strategyId?: string;
    statusIds?: string[];
};

export type FetchProjectReportsOpts = {
    projectId?: number;
    filters?: BffFilters;
    confirmStatus?: "all" | ConfirmStatus;
    includeExtras?: boolean;
};

async function fetchUserClaims(sessionToken: string): Promise<{
    userId: number;
    companyId: number;
}> {
    const api = createInternalApiClient(sessionToken);
    const { data } = await api.get<{ Data?: { xUserId_pk?: number; xCompanyId_fk?: number } }>(
        "/api/user-information",
    );
    const userId = data.Data?.xUserId_pk;
    const companyId = data.Data?.xCompanyId_fk;
    if (typeof userId !== "number" || typeof companyId !== "number") {
        throw new ApiRequestError("User information missing required claims");
    }
    return { userId, companyId };
}

async function fetchGeneralSettings(
    sessionToken: string,
    companyId: number,
): Promise<Record<string, string>> {
    const portal = await createAuthenticatedPortalApiClient(sessionToken);
    const { data } = await portal.post<{
        Data?: Array<{ xSettingKey?: string; xSettingValue?: string }>;
    }>("Setting/GetAll", {
        OptionalId: "",
        UserId: 0,
        UserId2: 0,
        UserId3: 0,
        ApplicationId: APPLICATION_ID,
        CompanyId: companyId,
        EntityTypeId: 0,
        EntityTypeGroupId: 0,
        IsActive: 0,
        SearchCondition: "",
        Code: "",
        FromDateTime: "",
        ToDateTime: "",
    });

    const rows = data.Data ?? [];
    return rows.reduce<Record<string, string>>((acc, row) => {
        if (typeof row.xSettingKey === "string" && typeof row.xSettingValue === "string") {
            acc[row.xSettingKey] = row.xSettingValue;
        }
        return acc;
    }, {});
}

/**
 * Lists project reports via Portal BFF (always loads extras server-side;
 * we strip them unless includeExtras is true).
 */
export async function fetchProjectReports(
    sessionToken: string,
    opts: FetchProjectReportsOpts = {},
): Promise<ProjectReportWithExtras[]> {
    const includeExtras = opts.includeExtras ?? false;
    const confirmStatus = opts.confirmStatus ?? "all";

    const api = createInternalApiClient(sessionToken);
    const { data } = await api.post<{ Data?: unknown }>(PROJECT_REPORTS_BFF, {
        projectId: opts.projectId ?? null,
        filters: opts.projectId
            ? undefined
            : {
                  fromDate: opts.filters?.fromDate,
                  toDate: opts.filters?.toDate,
                  query: opts.filters?.query,
                  unitId: opts.filters?.unitId,
                  strategyId: opts.filters?.strategyId,
                  statusIds: opts.filters?.statusIds,
              },
    });

    const raw = data?.Data;
    if (!Array.isArray(raw)) {
        throw new ApiRequestError("Unexpected project-reports response shape");
    }

    const parsed = parseApiProjectReports(raw);
    return parsed
        .filter(r => matchesConfirmStatus(r.xIsConfirm, confirmStatus))
        .map(r => mapProjectReport(r, includeExtras));
}

/**
 * Resolves one report (with details + comments) by id.
 * Prefer passing projectId so the BFF can scope the list.
 */
export async function fetchProjectReport(
    sessionToken: string,
    opts: { projectReportId: string; projectId?: number },
): Promise<ProjectReportWithExtras> {
    const reports = await fetchProjectReports(sessionToken, {
        projectId: opts.projectId,
        includeExtras: true,
    });

    const found = reports.find(r => r.reportId === opts.projectReportId);
    if (!found) {
        throw new ApiRequestError(
            opts.projectId
                ? `Project report ${opts.projectReportId} not found for project ${opts.projectId}`
                : `Project report ${opts.projectReportId} not found`,
            404,
        );
    }
    return found;
}

async function fetchRawReportForUpdate(
    sessionToken: string,
    opts: { projectReportId: string; projectId: number },
): Promise<ApiProjectReport> {
    const api = createInternalApiClient(sessionToken);
    const { data } = await api.post<{ Data?: unknown }>(PROJECT_REPORTS_BFF, {
        projectId: opts.projectId,
    });

    const raw = data?.Data;
    if (!Array.isArray(raw)) {
        throw new ApiRequestError("Unexpected project-reports response shape");
    }

    for (const item of raw) {
        const parsed = apiProjectReportSchema.safeParse(item);
        if (parsed.success && parsed.data.xProjectReportId_pk === opts.projectReportId) {
            return parsed.data;
        }
    }

    throw new ApiRequestError(
        `Project report ${opts.projectReportId} not found for project ${opts.projectId}`,
        404,
    );
}

/**
 * Updates planned amounts on a report (ControlProject users only).
 * Calls backend `Project/UpdateProjectReport` with a body built like Portal UI.
 */
export async function updateProjectReportPlans(
    sessionToken: string,
    opts: {
        projectReportId: string;
        projectId: number;
        planMaterialAmount: number;
        planManAmount: number;
        planMachineAmount: number;
        planContractorAmount: number;
    },
): Promise<{ success: boolean; message: string; reportId: string }> {
    const { userId, companyId } = await fetchUserClaims(sessionToken);
    const settings = await fetchGeneralSettings(sessionToken, companyId);

    if (!isGlobalControlProjectUser(userId, settings)) {
        throw new ApiRequestError(
            "Not allowed: user is not listed in ControlProject setting",
            403,
        );
    }

    const report = await fetchRawReportForUpdate(sessionToken, {
        projectReportId: opts.projectReportId,
        projectId: opts.projectId,
    });

    const portal = await createAuthenticatedPortalApiClient(sessionToken);
    const body = {
        xProjectReportId_pk: report.xProjectReportId_pk,
        xProjectId_fk: report.xProjectId_fk,
        xReportDateFrom: report.xReportDateFrom,
        xReportDateTo: report.xReportDateTo,
        xMaterialAmount: report.xMaterialAmount,
        xManAmount: report.xManAmount,
        xMachineAmount: report.xMachineAmount,
        xContractorAmount: report.xContractorAmount,
        xActualProgressPercent: report.xSumActualPercent ?? 0,
        xReasonDeviation: report.xReasonDeviation ?? "",
        xReportDescription: report.xReportDescription ?? "",
        xData: "",
        xRegisterDateFa: report.xRegisterDateFa,
        xUserId_fk: userId,
        xApplicationId_fk: APPLICATION_ID,
        xCompanyId_fk: companyId,
        xPlanMaterialAmount: opts.planMaterialAmount,
        xPlanMachineAmount: opts.planMachineAmount,
        xPlanManAmount: opts.planManAmount,
        xPlanContractorAmount: opts.planContractorAmount,
    };

    const { data } = await portal.post<{ Data?: boolean; Message?: string; message?: string }>(
        "Project/UpdateProjectReport",
        body,
    );

    const success = Boolean(data.Data);
    return {
        success,
        message:
            data.Message ??
            data.message ??
            (success ? "Planned amounts saved" : "Failed to update planned amounts"),
        reportId: opts.projectReportId,
    };
}
