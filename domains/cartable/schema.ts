import { z } from "zod/v4";

/** Raw title row from Portal BFF `/dashboard/cartable/api/cartable-title-new`. */
export const apiCartableTitleSchema = z.object({
    xCount: z.number(),
    xEntityTypeId_fk: z.number(),
    xCartableTitle: z.string(),
    xIcon: z.string().nullable().optional(),
});

/** Raw list row from Portal BFF `/dashboard/cartable/api/cartable-list`. */
export const apiCartableListItemSchema = z.object({
    xCartableId_pk: z.number(),
    xSenderFullname: z.string(),
    xTitle: z.string(),
    xUrl: z.string(),
    mappedUrl: z.string().nullable().optional(),
    xRegisterDateFa: z.string(),
    xReadDateFa: z.string().optional().default(""),
    xExitDateFa: z.string().optional().default(""),
    xIsExit: z.boolean(),
    xFirstViewDateFa: z.string().optional().default(""),
    xLastViewDateFa: z.string().optional().default(""),
    xFullnames: z.string().optional().default(""),
});

/** LLM-safe grouped title summary (one entry per entity type). */
export const cartableTitleSchema = z.object({
    entityTypeId: z.number(),
    title: z.string(),
    count: z.number(),
    icon: z.string().nullable(),
});

export const cartableTitlesOutputSchema = z.object({
    titles: z.array(cartableTitleSchema),
});

/** LLM-safe cartable list item. */
export const cartableListItemSchema = z.object({
    id: z.number(),
    title: z.string(),
    sender: z.string(),
    participants: z.string(),
    registerDate: z.string(),
    isExit: z.boolean(),
    portalUrl: z.string().nullable(),
    legacyUrl: z.string(),
});

export const cartableListInputSchema = z.object({
    entityTypeId: z
        .number()
        .int()
        .positive()
        .describe("Entity type id from get-cartable-titles"),
    isExit: z
        .boolean()
        .optional()
        .default(false)
        .describe("false = still in cartable (open), true = completed/done"),
});

export const cartableListOutputSchema = z.object({
    entityTypeId: z.number(),
    isExit: z.boolean(),
    items: z.array(cartableListItemSchema),
});

export type ApiCartableTitle = z.infer<typeof apiCartableTitleSchema>;
export type ApiCartableListItem = z.infer<typeof apiCartableListItemSchema>;
export type CartableTitle = z.infer<typeof cartableTitleSchema>;
export type CartableListItem = z.infer<typeof cartableListItemSchema>;
export type CartableListInput = z.infer<typeof cartableListInputSchema>;
