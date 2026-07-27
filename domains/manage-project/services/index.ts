import {
    ApiRequestError,
    createAuthenticatedPortalApiClient,
    createInternalApiClient,
} from "../../../utils/axios";
import {
    PROJECT_ROLE_SETTING_KEYS,
    canEditProjectStatus,
    resolveCommentCapability,
    resolveCommentRoleToSend,
    type CommentCapability,
    type CommentRoleType,
    type SignatoryRole,
} from "../../shared/project-permissions";
import {
    mapManageProject,
    mapScheduleItems,
    mapSCurvePoints,
    parseApiManageProjects,
} from "../map";
import {
    apiProjectStatusOptionSchema,
    apiSignatoryRoleSchema,
    type ApiManageProject,
    type ManageProject,
} from "../schema";

const MANAGE_PROJECTS_BFF = "/dashboard/project/api/manage-projects";
const PROJECT_SCURVE_BFF = "/dashboard/project/api/project-scurve";
const APPLICATION_ID = 2;
const SIGNATORY_ROLES_TYPE_GROUP_ID = 4006;

type ManageProjectsBffPayload = {
    projects?: unknown[];
    projectStatuses?: unknown[];
    controlProjectTypeId?: number | null;
    projectsSCurve?: Array<{ projectID?: number; projectId?: number; sCurveData?: unknown[] }>;
};

export type ManageProjectsResult = {
    projects: ManageProject[];
    projectStatuses: Array<{ value: string; label: string; typeId: number }>;
    controlProjectTypeId: number | null;
    canEditProjectStatus: boolean;
    projectsSCurve?: Array<{ projectId: number; points: ReturnType<typeof mapSCurvePoints> }>;
    rawProjects: ApiManageProject[];
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

async function fetchSignatoryRoles(
    sessionToken: string,
    userId: number,
): Promise<SignatoryRole[]> {
    const portal = await createAuthenticatedPortalApiClient(sessionToken);
    const { data } = await portal.post<{ Data?: unknown[] }>("Type/GetActiveByTypeGroupId", {
        Id: 0,
        TypeId: SIGNATORY_ROLES_TYPE_GROUP_ID,
        UserId: userId,
    });

    const raw = data.Data ?? [];
    return raw.flatMap(item => {
        const parsed = apiSignatoryRoleSchema.safeParse(item);
        return parsed.success
            ? [{ xCode: parsed.data.xCode, xTypeTitle: parsed.data.xTypeTitle }]
            : [];
    });
}

function unwrapBffData<T>(data: unknown): T {
    if (data && typeof data === "object" && "Data" in data) {
        return (data as { Data: T }).Data;
    }
    return data as T;
}

function parseProjectStatuses(raw: unknown[]) {
    return raw.flatMap(item => {
        const parsed = apiProjectStatusOptionSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
    });
}

/**
 * Fetches manage-projects list + init data via Portal BFF.
 */
export async function fetchManageProjects(
    sessionToken: string,
    opts: {
        fromDateFa?: string;
        toDateFa?: string;
        includeSCurve?: boolean;
        includeCapability?: boolean;
    } = {},
): Promise<ManageProjectsResult> {
    const includeSCurve = opts.includeSCurve ?? false;
    const includeCapability = opts.includeCapability ?? true;

    const api = createInternalApiClient(sessionToken);
    const { data } = await api.get<unknown>(MANAGE_PROJECTS_BFF, {
        params: {
            ...(opts.fromDateFa ? { fromDateFa: opts.fromDateFa } : {}),
            ...(opts.toDateFa ? { toDateFa: opts.toDateFa } : {}),
        },
    });

    const payload = unwrapBffData<ManageProjectsBffPayload>(data);
    if (!payload || !Array.isArray(payload.projects)) {
        throw new ApiRequestError("Unexpected manage-projects response shape");
    }

    const rawProjects = parseApiManageProjects(payload.projects);
    const projectStatuses = parseProjectStatuses(payload.projectStatuses ?? []);
    const controlProjectTypeId =
        typeof payload.controlProjectTypeId === "number" ? payload.controlProjectTypeId : null;

    const { userId, companyId } = await fetchUserClaims(sessionToken);
    const [generalSetting, signatoryRoles] = includeCapability
        ? await Promise.all([
              fetchGeneralSettings(sessionToken, companyId),
              fetchSignatoryRoles(sessionToken, userId),
          ])
        : [null, undefined];

    const canEdit = canEditProjectStatus({
        controlProjectTypeId,
        generalSetting: generalSetting ?? {},
    });

    const projects = rawProjects.map(raw => {
        const capability = includeCapability
            ? resolveCommentCapability({
                  userId,
                  project: raw,
                  generalSetting,
                  signatoryRoles,
              })
            : undefined;
        return mapManageProject(raw, capability);
    });

    const result: ManageProjectsResult = {
        projects,
        projectStatuses,
        controlProjectTypeId,
        canEditProjectStatus: canEdit,
        rawProjects,
    };

    if (includeSCurve && Array.isArray(payload.projectsSCurve)) {
        result.projectsSCurve = payload.projectsSCurve.map(entry => {
            const projectId = entry.projectID ?? entry.projectId ?? 0;
            return {
                projectId,
                points: mapSCurvePoints(entry.sCurveData ?? []),
            };
        });
    }

    return result;
}

export async function fetchManageProject(
    sessionToken: string,
    opts: { projectId: number; includeSCurve?: boolean },
): Promise<{
    project: ManageProject;
    projectStatuses: ManageProjectsResult["projectStatuses"];
    controlProjectTypeId: number | null;
    canEditProjectStatus: boolean;
    sCurve?: ReturnType<typeof mapSCurvePoints>;
    raw: ApiManageProject;
}> {
    const list = await fetchManageProjects(sessionToken, {
        includeSCurve: false,
        includeCapability: true,
    });

    const raw = list.rawProjects.find(p => p.xProjectId_pk === opts.projectId);
    const project = list.projects.find(p => p.projectId === opts.projectId);
    if (!raw || !project) {
        throw new ApiRequestError(`Project ${opts.projectId} not found`, 404);
    }

    let sCurve: ReturnType<typeof mapSCurvePoints> | undefined;
    if (opts.includeSCurve) {
        sCurve = await fetchProjectSCurve(sessionToken, opts.projectId);
    }

    return {
        project,
        projectStatuses: list.projectStatuses,
        controlProjectTypeId: list.controlProjectTypeId,
        canEditProjectStatus: list.canEditProjectStatus,
        sCurve,
        raw,
    };
}

export async function fetchProjectSCurve(
    sessionToken: string,
    projectId: number,
): Promise<ReturnType<typeof mapSCurvePoints>> {
    const api = createInternalApiClient(sessionToken);
    const { data } = await api.post<unknown>(PROJECT_SCURVE_BFF, { projectID: projectId });
    const payload = unwrapBffData<{ projectID?: number; sCurveData?: unknown[] }>(data);
    return mapSCurvePoints(payload?.sCurveData ?? []);
}

export async function fetchProjectSchedule(
    sessionToken: string,
    projectId: number,
): Promise<ReturnType<typeof mapScheduleItems>> {
    const { userId, companyId } = await fetchUserClaims(sessionToken);
    const portal = await createAuthenticatedPortalApiClient(sessionToken);
    const { data } = await portal.post<{ Data?: unknown[] }>(
        "Project/GetAllProjectScheduleForManage",
        {
            Id: String(projectId),
            Id2: String(projectId),
            UserId: userId,
            UserId2: 0,
            ApplicationId: APPLICATION_ID,
            CompanyId: companyId,
            EntityTypeId: 0,
            EntityTypeGroupId: 0,
            Version: 0,
        },
    );
    return mapScheduleItems(data.Data ?? []);
}

export async function fetchProjectCommentCapability(
    sessionToken: string,
    projectId: number,
): Promise<{ projectId: number; capability: CommentCapability }> {
    const { userId, companyId } = await fetchUserClaims(sessionToken);
    const [list, generalSetting, signatoryRoles] = await Promise.all([
        fetchManageProjects(sessionToken, { includeCapability: false, includeSCurve: false }),
        fetchGeneralSettings(sessionToken, companyId),
        fetchSignatoryRoles(sessionToken, userId),
    ]);

    const raw = list.rawProjects.find(p => p.xProjectId_pk === projectId);
    if (!raw) {
        throw new ApiRequestError(`Project ${projectId} not found`, 404);
    }

    return {
        projectId,
        capability: resolveCommentCapability({
            userId,
            project: raw,
            generalSetting,
            signatoryRoles,
        }),
    };
}

export async function insertProjectComment(
    sessionToken: string,
    opts: {
        projectId: number;
        description: string;
        status: boolean;
        commentAsRole?: CommentRoleType;
    },
): Promise<{
    success: boolean;
    message: string;
    projectId: number;
    roleType: CommentRoleType;
    project?: ManageProject;
}> {
    const { userId, companyId } = await fetchUserClaims(sessionToken);
    const [list, generalSetting, signatoryRoles] = await Promise.all([
        fetchManageProjects(sessionToken, { includeCapability: false, includeSCurve: false }),
        fetchGeneralSettings(sessionToken, companyId),
        fetchSignatoryRoles(sessionToken, userId),
    ]);

    const raw = list.rawProjects.find(p => p.xProjectId_pk === opts.projectId);
    if (!raw) {
        throw new ApiRequestError(`Project ${opts.projectId} not found`, 404);
    }

    const capability = resolveCommentCapability({
        userId,
        project: raw,
        generalSetting,
        signatoryRoles,
    });

    let roleType: CommentRoleType;
    try {
        roleType = resolveCommentRoleToSend({
            capability,
            commentAsRole: opts.commentAsRole,
        });
    } catch (error) {
        throw new ApiRequestError(
            error instanceof Error ? error.message : "Not allowed to comment",
            403,
        );
    }

    const portal = await createAuthenticatedPortalApiClient(sessionToken);
    const { data } = await portal.post<{ Data?: boolean; Message?: string; message?: string }>(
        "Project/InsertProjectDesc",
        {
            Id: opts.projectId,
            UserId: userId,
            ApplicationId: APPLICATION_ID,
            CompanyId: companyId,
            EntityTypeId: 0,
            EntityTypeGroupId: 0,
            Desc: opts.description,
            Type: roleType,
            Status: opts.status,
        },
    );

    const success = Boolean(data.Data);
    let project: ManageProject | undefined;
    if (success) {
        try {
            const refreshed = await fetchManageProject(sessionToken, {
                projectId: opts.projectId,
                includeSCurve: false,
            });
            project = refreshed.project;
        } catch {
            // ignore refresh failures; write already succeeded
        }
    }

    return {
        success,
        message:
            data.Message ??
            data.message ??
            (success ? "Comment saved" : "Failed to save comment"),
        projectId: opts.projectId,
        roleType,
        project,
    };
}

export async function updateProjectStatus(
    sessionToken: string,
    opts: { projectId: number; statusId: number },
): Promise<{ success: boolean; message: string; projectId: number; statusId: number }> {
    const { userId, companyId } = await fetchUserClaims(sessionToken);
    const [list, generalSetting] = await Promise.all([
        fetchManageProjects(sessionToken, { includeCapability: false, includeSCurve: false }),
        fetchGeneralSettings(sessionToken, companyId),
    ]);

    const exists = list.rawProjects.some(p => p.xProjectId_pk === opts.projectId);
    if (!exists) {
        throw new ApiRequestError(`Project ${opts.projectId} not found`, 404);
    }

    if (
        !canEditProjectStatus({
            controlProjectTypeId: list.controlProjectTypeId,
            generalSetting,
        })
    ) {
        throw new ApiRequestError(
            "Not allowed: project status editing is disabled (ControlProject feature flag mismatch)",
            403,
        );
    }

    const portal = await createAuthenticatedPortalApiClient(sessionToken);
    const { data } = await portal.post<{ Data?: boolean; Message?: string; message?: string }>(
        "Project/UpdateProjectStatus",
        {
            StatusId: opts.statusId,
            Id: opts.projectId,
            UserId: userId,
            ApplicationId: APPLICATION_ID,
            CompanyId: companyId,
            EntityTypeId: 0,
            EntityTypeGroupId: 0,
        },
    );

    const success = Boolean(data.Data);
    return {
        success,
        message:
            data.Message ??
            data.message ??
            (success ? "Project status updated" : "Failed to update project status"),
        projectId: opts.projectId,
        statusId: opts.statusId,
    };
}

/** Expose setting key for docs/tests. */
export { PROJECT_ROLE_SETTING_KEYS };
