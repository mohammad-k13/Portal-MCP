import {
    COMMENT_ROLE_TYPES,
    getUserRoleInfo,
    type CommentRoleType,
    type ProjectCommentFields,
    type SignatoryRole,
    type UserRoleInfo,
} from "./comment-roles";
import { isControlProjectUser } from "./has-project-role";
import { PROJECT_ROLE_SETTING_KEYS } from "./keys";

export type CommentCapability = {
    canComment: boolean;
    isControlProjectUser: boolean;
    userRoleInfo: UserRoleInfo | null;
    allowedCommentRoles: CommentRoleType[];
};

export type ProjectForCapability = ProjectCommentFields & {
    xIsEditWithControlProject?: boolean;
};

/**
 * Mirrors Portal `useCanCommentOnProject`.
 * Control users may comment as any of the five roles; signatories only as themselves.
 */
export function resolveCommentCapability(opts: {
    userId: number;
    project: ProjectForCapability | null | undefined;
    generalSetting: Record<string, string> | null | undefined;
    signatoryRoles: SignatoryRole[] | undefined;
}): CommentCapability {
    const { userId, project, generalSetting, signatoryRoles } = opts;

    if (!project) {
        return {
            canComment: false,
            isControlProjectUser: false,
            userRoleInfo: null,
            allowedCommentRoles: [],
        };
    }

    const control = isControlProjectUser(
        userId,
        project.xReferToUserIds,
        generalSetting,
        project.xIsEditWithControlProject,
    );
    const userRoleInfo = getUserRoleInfo(project, userId, signatoryRoles);
    const canComment = control || !!userRoleInfo;

    const allowedCommentRoles: CommentRoleType[] = control
        ? [...COMMENT_ROLE_TYPES]
        : userRoleInfo
          ? [userRoleInfo.roleType]
          : [];

    return {
        canComment,
        isControlProjectUser: control,
        userRoleInfo,
        allowedCommentRoles,
    };
}

/**
 * Resolve the role Type string to send to InsertProjectDesc.
 * Throws a descriptive error string when the agent is not allowed.
 */
export function resolveCommentRoleToSend(opts: {
    capability: CommentCapability;
    commentAsRole?: CommentRoleType;
}): CommentRoleType {
    const { capability, commentAsRole } = opts;

    if (!capability.canComment) {
        throw new Error("Not allowed: user cannot comment on this project");
    }

    if (capability.isControlProjectUser) {
        if (!commentAsRole) {
            throw new Error(
                "commentAsRole is required for ControlProject users (ceo|projectmanager|qa|financial|planning)",
            );
        }
        if (!capability.allowedCommentRoles.includes(commentAsRole)) {
            throw new Error(`Not allowed: invalid commentAsRole ${commentAsRole}`);
        }
        return commentAsRole;
    }

    const ownRole = capability.userRoleInfo?.roleType;
    if (!ownRole) {
        throw new Error("Not allowed: user signatory role not found on this project");
    }
    if (commentAsRole && commentAsRole !== ownRole) {
        throw new Error(
            `Not allowed: signatory users may only comment as ${ownRole}, not ${commentAsRole}`,
        );
    }
    return ownRole;
}

/**
 * Mirrors Portal `project-confirm-status` canEdit flag:
 * controlProjectTypeId (Type 2001, xCode "6") === ControlProject setting value.
 */
export function canEditProjectStatus(opts: {
    controlProjectTypeId: number | null | undefined;
    generalSetting: Record<string, string> | null | undefined;
}): boolean {
    const controlProjectSettingId =
        opts.generalSetting?.[PROJECT_ROLE_SETTING_KEYS.CONTROL_PROJECT];
    return (
        opts.controlProjectTypeId != null &&
        controlProjectSettingId !== undefined &&
        String(opts.controlProjectTypeId) === String(controlProjectSettingId)
    );
}
