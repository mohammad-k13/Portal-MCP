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
    xReadDateFa: z.string().nullish().transform(v => v ?? ""),
    xExitDateFa: z.string().nullish().transform(v => v ?? ""),
    xIsExit: z.boolean(),
    xFirstViewDateFa: z.string().nullish().transform(v => v ?? ""),
    xLastViewDateFa: z.string().nullish().transform(v => v ?? ""),
    // Portal often returns null for this field.
    xFullnames: z.string().nullish().transform(v => v ?? ""),
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

/** false = open, true = done, "all" = both open and done. */
export const cartableIsExitFilterSchema = z
    .union([z.boolean(), z.literal("all")])
    .optional()
    .default(false)
    .describe('false = open items, true = completed/done, "all" = both');

export const cartableListInputSchema = z.object({
    entityTypeId: z
        .number()
        .int()
        .positive()
        .describe("Entity type id from get-cartable-titles"),
    isExit: cartableIsExitFilterSchema,
});

export const cartableListOutputSchema = z.object({
    entityTypeId: z.number(),
    isExit: z.union([z.boolean(), z.literal("all")]),
    items: z.array(cartableListItemSchema),
});

/** Input for listing every entity type's items in one call. */
export const cartableAllListsInputSchema = z.object({
    isExit: cartableIsExitFilterSchema,
    /** When true (default), skip entity types whose open count is 0. Ignored if isExit is not false. */
    onlyWithCount: z
        .boolean()
        .optional()
        .default(true)
        .describe("If true, only fetch entity types that appear in get-cartable-titles with count > 0"),
});

export const cartableAllListsOutputSchema = z.object({
    isExit: z.union([z.boolean(), z.literal("all")]),
    groups: z.array(
        z.object({
            entityTypeId: z.number(),
            title: z.string(),
            count: z.number(),
            items: z.array(cartableListItemSchema),
        }),
    ),
});

export type ApiCartableTitle = z.infer<typeof apiCartableTitleSchema>;
export type ApiCartableListItem = z.infer<typeof apiCartableListItemSchema>;
export type CartableTitle = z.infer<typeof cartableTitleSchema>;
export type CartableListItem = z.infer<typeof cartableListItemSchema>;
export type CartableListInput = z.infer<typeof cartableListInputSchema>;
export type CartableIsExitFilter = boolean | "all";
export type CartableAllListsInput = z.infer<typeof cartableAllListsInputSchema>;
