/**
 * Re-exports shared ControlProject helpers so project-report stays consistent
 * with manage-project permission logic.
 */
export {
    PROJECT_ROLE_SETTING_KEYS,
    parseRoleIdsFromSetting,
    isGlobalControlProjectUser,
} from "../shared/project-permissions";

/** @deprecated Use PROJECT_ROLE_SETTING_KEYS.CONTROL_PROJECT */
export const CONTROL_PROJECT_SETTING_KEY = "ControlProject";
