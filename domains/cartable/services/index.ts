import { createInternalApiClient, ApiRequestError } from "../../../utils/axios";
import {
    apiCartableListItemSchema,
    apiCartableTitleSchema,
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
 * Fetches cartable items for an entity type via Portal BFF.
 * Mirrors `POST /dashboard/cartable/api/cartable-list`.
 */
export async function fetchCartableList(
    sessionToken: string,
    opts: { entityTypeId: number; isExit: boolean },
): Promise<CartableListItem[]> {
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
