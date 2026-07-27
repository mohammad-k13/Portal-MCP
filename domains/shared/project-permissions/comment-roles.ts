export type CommentRoleType =
    | "ceo"
    | "projectmanager"
    | "qa"
    | "financial"
    | "planning";

export const COMMENT_ROLE_TYPES: CommentRoleType[] = [
    "ceo",
    "projectmanager",
    "qa",
    "financial",
    "planning",
];

type ProjectCommentField =
    | "xCEODesc"
    | "xProjectManagerDesc"
    | "xQAManagerDesc"
    | "xFinancialManagerDesc"
    | "xPlanningManagerDesc";

type ProjectStatusField =
    | "xCEOStatus"
    | "xProjectManagerStatus"
    | "xQAManagerStatus"
    | "xFinancialManagerStatus"
    | "xPlanningManagerStatus";

interface RoleMapping {
    keywords: string[];
    field: ProjectCommentField;
    type: CommentRoleType;
    label: string;
    statusField: ProjectStatusField;
}

export interface UserRoleInfo {
    roleCode: string;
    roleType: CommentRoleType;
    roleLabel: string;
    lastComment: string;
    status: boolean | null;
}

/** Minimal project shape needed for comment role resolution. */
export type ProjectCommentFields = {
    xReferToUserIds?: string | null;
    xCEODesc?: string | null;
    xProjectManagerDesc?: string | null;
    xQAManagerDesc?: string | null;
    xFinancialManagerDesc?: string | null;
    xPlanningManagerDesc?: string | null;
    xCEOStatus?: boolean | null;
    xProjectManagerStatus?: boolean | null;
    xQAManagerStatus?: boolean | null;
    xFinancialManagerStatus?: boolean | null;
    xPlanningManagerStatus?: boolean | null;
};

export type SignatoryRole = {
    xCode: string;
    xTypeTitle: string;
};

export const PROJECT_COMMENT_ROLE_MAPPINGS = [
    {
        keywords: ["مدیرعامل", "مدیر عامل"],
        field: "xCEODesc",
        type: "ceo",
        label: "مدیرعامل",
        statusField: "xCEOStatus",
    },
    {
        keywords: ["مدیر پروژه"],
        field: "xProjectManagerDesc",
        type: "projectmanager",
        label: "مدیر پروژه",
        statusField: "xProjectManagerStatus",
    },
    {
        keywords: ["مدیر تضمین کیفیت", "تضمین کیفیت", "کنترل کیفیت"],
        field: "xQAManagerDesc",
        type: "qa",
        label: "مدیر تضمین کیفیت",
        statusField: "xQAManagerStatus",
    },
    {
        keywords: ["مدیر مالی"],
        field: "xFinancialManagerDesc",
        type: "financial",
        label: "مدیر مالی",
        statusField: "xFinancialManagerStatus",
    },
    {
        keywords: ["مدیر طرح و برنامه", "مدیر برنامه\u200cریزی", "برنامه\u200cریزی", "امور مالی"],
        field: "xPlanningManagerDesc",
        type: "planning",
        label: "مدیر طرح و برنامه",
        statusField: "xPlanningManagerStatus",
    },
] satisfies RoleMapping[];

export function getReferPairs(referToUserIds: string | null | undefined) {
    if (!referToUserIds) return [];

    const cleanValue = referToUserIds.endsWith(";")
        ? referToUserIds.slice(0, -1)
        : referToUserIds;
    return cleanValue
        .split(";")
        .map(pair => {
            const [roleCode, userId] = pair.split(",");
            return { roleCode, userId: Number(userId) };
        })
        .filter(pair => pair.roleCode && Number.isFinite(pair.userId));
}

function findRoleMapping(roleTitle: string) {
    return (
        PROJECT_COMMENT_ROLE_MAPPINGS.find(mapping =>
            mapping.keywords.some(keyword => roleTitle.includes(keyword)),
        ) ?? null
    );
}

export function getCommentInfoByRoleType(
    project: ProjectCommentFields | null,
    roleType: CommentRoleType,
): UserRoleInfo | null {
    if (!project) return null;

    const roleMapping = PROJECT_COMMENT_ROLE_MAPPINGS.find(mapping => mapping.type === roleType);
    if (!roleMapping) return null;

    return {
        roleCode: "",
        roleType: roleMapping.type,
        roleLabel: roleMapping.label,
        lastComment: project[roleMapping.field] || "",
        status: project[roleMapping.statusField] ?? null,
    };
}

/** Resolve the current user's own signatory role on this project. */
export function getUserRoleInfo(
    project: ProjectCommentFields | null,
    currentUserId: number | undefined,
    signatoryRoles: SignatoryRole[] | undefined,
): UserRoleInfo | null {
    if (!project || !currentUserId || !signatoryRoles) return null;

    const userPair = getReferPairs(project.xReferToUserIds).find(
        pair => pair.userId === currentUserId,
    );
    if (!userPair) return null;

    const role = signatoryRoles.find(item => item.xCode === userPair.roleCode);
    if (!role) return null;

    const roleMapping = findRoleMapping(role.xTypeTitle);
    if (!roleMapping) return null;

    return {
        roleCode: userPair.roleCode,
        roleType: roleMapping.type,
        roleLabel: roleMapping.label,
        lastComment: project[roleMapping.field] || "",
        status: project[roleMapping.statusField] ?? null,
    };
}
