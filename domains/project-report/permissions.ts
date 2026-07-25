/** Mirrors Portal `PROJECT_ROLE_SETTING_KEYS.CONTROL_PROJECT`. */
export const CONTROL_PROJECT_SETTING_KEY = "ControlProject";

export function parseRoleIdsFromSetting(value: string | undefined | null): string[] {
    if (!value?.trim()) return [];
    return value
        .split(",")
        .map(id => id.trim())
        .filter(Boolean);
}

/**
 * Global ControlProject check: Setting value lists user ids (Portal GetAll).
 * Mirrors `isGlobalControlProjectUser` in Portal.
 */
export function isGlobalControlProjectUser(
    userId: number,
    generalSetting?: Record<string, string> | null,
): boolean {
    const controlValues = parseRoleIdsFromSetting(generalSetting?.[CONTROL_PROJECT_SETTING_KEY]);
    return controlValues.some(id => Number(id) === userId);
}
