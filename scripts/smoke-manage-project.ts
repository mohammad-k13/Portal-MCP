import { registerManageProjectTools } from "../domains/manage-project/tools.ts";
import {
    canEditProjectStatus,
    isControlProjectUser,
    resolveCommentCapability,
    resolveCommentRoleToSend,
} from "../domains/shared/project-permissions/index.ts";

// Permission smoke (no network)
const settings = { ControlProject: "1006,9999" };
const signatoryRoles = [
    { xCode: "3", xTypeTitle: "مدیر پروژه" },
    { xCode: "1", xTypeTitle: "مدیرعامل" },
];
const project = {
    xReferToUserIds: "3,42;",
    xIsEditWithControlProject: false,
    xProjectManagerDesc: "old pm",
    xProjectManagerStatus: true,
};

const asserts: Array<[string, boolean]> = [
    ["controlById", isControlProjectUser(1006, "", settings, false)],
    ["controlByFlag", isControlProjectUser(1, "", {}, true)],
    [
        "signatoryCanComment",
        resolveCommentCapability({
            userId: 42,
            project,
            generalSetting: settings,
            signatoryRoles,
        }).canComment,
    ],
    [
        "strangerCannot",
        !resolveCommentCapability({
            userId: 999,
            project,
            generalSetting: settings,
            signatoryRoles,
        }).canComment,
    ],
    [
        "statusFlag",
        canEditProjectStatus({
            controlProjectTypeId: 55,
            generalSetting: { ControlProject: "55" },
        }),
    ],
];

const signatoryCap = resolveCommentCapability({
    userId: 42,
    project,
    generalSetting: settings,
    signatoryRoles,
});
try {
    resolveCommentRoleToSend({ capability: signatoryCap, commentAsRole: "ceo" });
    asserts.push(["denyForeignRole", false]);
} catch {
    asserts.push(["denyForeignRole", true]);
}

const failed = asserts.filter(([, ok]) => !ok);
if (failed.length) {
    console.error("FAILED", failed.map(([name]) => name));
    process.exit(1);
}

// Tool registration smoke
const registered: string[] = [];
const fakeServer = {
    registerTool(name: string) {
        registered.push(name);
    },
};
registerManageProjectTools(fakeServer as never);
const expected = [
    "get-manage-projects",
    "get-manage-project",
    "get-project-schedule",
    "get-project-comment-capability",
    "insert-project-comment",
    "update-project-status",
];
for (const name of expected) {
    if (!registered.includes(name)) {
        console.error("missing tool", name);
        process.exit(1);
    }
}

console.log("SMOKE_OK", { permissions: asserts.length, tools: registered.length });
