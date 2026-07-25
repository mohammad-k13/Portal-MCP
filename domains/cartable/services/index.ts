import { createInternalApiClient, ApiRequestError } from "../../../utils/axios";
import {
    apiCartableListItemSchema,
    apiCartableTitleSchema,
    type CartableIsExitFilter,
    type CartableListItem,
    type CartableTitle,
} from "../schema";
import { z } from "zod/v4";

function mapTitles(raw: z.infer<typeof apiCartableTitleSchema>[]): CartableTitle[] {
    const byType = new Map<number, CartableTitle>();

    for (const item of raw) {
        const existing = byType.get(item.xEntityTypeId_fk);
        if (existing) {
            existing.count += item.xCount;
            continue;
        }

        byType.set(item.xEntityTypeId_fk, {
            entityTypeId: item.xEntityTypeId_fk,
            title: item.xCartableTitle,
            count: item.xCount,
            icon: item.xIcon ?? null,
        });
    }

    return Array.from(byType.values());
}

function mapListItem(item: z.infer<typeof apiCartableListItemSchema>): CartableListItem {
    return {
        id: item.xCartableId_pk,
        title: item.xTitle,
        sender: item.xSenderFullname,
        participants: item.xFullnames,
        registerDate: item.xRegisterDateFa,
        isExit: item.xIsExit,
        portalUrl: item.mappedUrl ?? null,
        legacyUrl: item.xUrl,
    };
}

function mergeItemsById(items: CartableListItem[]): CartableListItem[] {
    const byId = new Map<number, CartableListItem>();
    for (const item of items) {
        byId.set(item.id, item);
    }
    return Array.from(byId.values());
}

/**
 * Fetches cartable title/count summary via Portal BFF.
 * Mirrors `GET /dashboard/cartable/api/cartable-title-new`.
 */
export async function fetchCartableTitles(sessionToken: string): Promise<CartableTitle[]> {
    const api = createInternalApiClient(sessionToken);
    const { data } = await api.get<{ Data?: unknown }>("/dashboard/cartable/api/cartable-title-new");

    const raw = data?.Data;
    if (!Array.isArray(raw)) {
        throw new ApiRequestError("Unexpected cartable-title-new response shape");
    }

    const parsed = z.array(apiCartableTitleSchema).safeParse(raw);
    if (!parsed.success) {
        throw new ApiRequestError("Unexpected cartable-title-new item shape");
    }

    return mapTitles(parsed.data);
}

/**
 * Fetches cartable items for one entity type via Portal BFF.
 * Mirrors `POST /dashboard/cartable/api/cartable-list`.
 */
export async function fetchCartableList(
    sessionToken: string,
    opts: { entityTypeId: number; isExit: CartableIsExitFilter },
): Promise<CartableListItem[]> {
    if (opts.isExit === "all") {
        const [openItems, doneItems] = await Promise.all([
            fetchCartableList(sessionToken, { entityTypeId: opts.entityTypeId, isExit: false }),
            fetchCartableList(sessionToken, { entityTypeId: opts.entityTypeId, isExit: true }),
        ]);
        return mergeItemsById([...openItems, ...doneItems]);
    }

    const api = createInternalApiClient(sessionToken);
    const { data } = await api.post<{ Data?: unknown }>("/dashboard/cartable/api/cartable-list", {
        EntityTypeId: opts.entityTypeId,
        IsExit: opts.isExit,
    });

    const raw = data?.Data;
    if (!Array.isArray(raw)) {
        throw new ApiRequestError("Unexpected cartable-list response shape");
    }

    const parsed = z.array(apiCartableListItemSchema).safeParse(raw);
    if (!parsed.success) {
        throw new ApiRequestError("Unexpected cartable-list item shape");
    }

    return parsed.data.map(mapListItem);
}

export type CartableListGroup = {
    entityTypeId: number;
    title: string;
    count: number;
    items: CartableListItem[];
};

/**
 * Resolves entity types from titles, then fetches list items for each.
 * Use when the user wants the full cartable across categories in one call.
 */
export async function fetchAllCartableLists(
    sessionToken: string,
    opts: { isExit?: CartableIsExitFilter; onlyWithCount?: boolean } = {},
): Promise<CartableListGroup[]> {
    const isExit = opts.isExit ?? false;
    const onlyWithCount = opts.onlyWithCount ?? true;

    const titles = await fetchCartableTitles(sessionToken);
    const selected = onlyWithCount && isExit === false
        ? titles.filter(t => t.count > 0)
        : titles;

    const groups = await Promise.all(
        selected.map(async title => {
            const items = await fetchCartableList(sessionToken, {
                entityTypeId: title.entityTypeId,
                isExit,
            });
            return {
                entityTypeId: title.entityTypeId,
                title: title.title,
                count: title.count,
                items,
            };
        }),
    );

    return groups;
}
