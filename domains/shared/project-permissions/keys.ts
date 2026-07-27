/**
 * Role id keys from Setting/GetAll (generalSetting).
 * Mirrors Portal `lib/permissions/project-role-keys.ts`.
 */
export const PROJECT_ROLE_SETTING_KEYS = {
    PROJECT_MANAGER: "ProjectManagerRoleId",
    CONTROL_PROJECT: "ControlProject",
    CEO: "CEORoleId",
} as const;

export type ProjectRoleSettingKey =
    (typeof PROJECT_ROLE_SETTING_KEYS)[keyof typeof PROJECT_ROLE_SETTING_KEYS];
