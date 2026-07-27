import { PROJECT_ROLE_SETTING_KEYS, type ProjectRoleSettingKey } from "./keys";

/** Parse role/user ids from a Setting value (e.g. "3,5,7"). */
export function parseRoleIdsFromSetting(value: string | undefined | null): string[] {
    if (!value?.trim()) return [];
    return value
        .split(",")
        .map(id => id.trim())
        .filter(Boolean);
}

/** Collect role ids from one or more generalSetting keys. */
export function getRoleIdsFromSettings(
    generalSetting: Record<string, string> | null | undefined,
    ...keys: ProjectRoleSettingKey[]
): string[] {
    const ids = new Set<string>();
    for (const key of keys) {
        parseRoleIdsFromSetting(generalSetting?.[key]).forEach(id => ids.add(id));
    }
    return [...ids];
}

/**
 * Whether the user holds one of the allowed roles on the project.
 * refer format: "roleCode,userId;roleCode,userId"
 */
export function hasProjectRoleOnProject(
    referToUserIds: string | null | undefined,
    allowedRoleIds: string[],
    userId: number,
): boolean {
    if (!referToUserIds || allowedRoleIds.length === 0) return false;

    const cleanString = referToUserIds.endsWith(";")
        ? referToUserIds.slice(0, -1)
        : referToUserIds;

    return cleanString.split(";").some(pair => {
        const [roleId, assignedUserId] = pair.split(",");
        return allowedRoleIds.includes(roleId) && Number(assignedUserId) === userId;
    });
}

/** Whether ControlProject setting lists this user id (global, any project). */
export function isGlobalControlProjectUser(
    userId: number,
    generalSetting?: Record<string, string> | null,
): boolean {
    const controlValues = parseRoleIdsFromSetting(
        generalSetting?.[PROJECT_ROLE_SETTING_KEYS.CONTROL_PROJECT],
    );
    return controlValues.some(id => Number(id) === userId);
}

/**
 * Whether the current user is the control project user.
 * - Global: user id is listed in ControlProject (GetAll)
 * - Per project: user holds the control role in xReferToUserIds
 * - Per project: backend flag xIsEditWithControlProject
 */
export function isControlProjectUser(
    userId: number,
    referToUserIds?: string | null,
    generalSetting?: Record<string, string> | null,
    isEditWithControlProject?: boolean,
): boolean {
    if (isEditWithControlProject) return true;

    const controlValues = parseRoleIdsFromSetting(
        generalSetting?.[PROJECT_ROLE_SETTING_KEYS.CONTROL_PROJECT],
    );
    if (controlValues.length === 0) return false;

    if (controlValues.some(id => Number(id) === userId)) {
        return true;
    }

    if (referToUserIds) {
        return hasProjectRoleOnProject(referToUserIds, controlValues, userId);
    }

    return false;
}

/**
 * Does the current user have any of the given roles on this project?
 * Role ids are read from generalSetting using the provided keys.
 */
export function userHasProjectRole(
    referToUserIds: string | null | undefined,
    userId: number,
    generalSetting: Record<string, string> | null | undefined,
    ...roleKeys: ProjectRoleSettingKey[]
): boolean {
    const roleIds = getRoleIdsFromSettings(generalSetting, ...roleKeys);
    return hasProjectRoleOnProject(referToUserIds, roleIds, userId);
}
