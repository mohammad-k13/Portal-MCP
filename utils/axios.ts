import axios, { AxiosError, type AxiosInstance } from "axios";

export class ApiRequestError extends Error {
    constructor(
        message: string,
        readonly status?: number,
    ) {
        super(message);
        this.name = "ApiRequestError";
    }
}

function addErrorInterceptor(client: AxiosInstance): AxiosInstance {
    client.interceptors.response.use(
        response => response,
        (error: AxiosError<{ message?: string; Message?: string }>) => {
            const status = error.response?.status;
            const message =
                error.response?.data?.message ??
                error.response?.data?.Message ??
                (status ? `API request failed with status ${status}` : "Unable to reach the API");

            return Promise.reject(new ApiRequestError(message, status));
        },
    );

    return client;
}

export function createInternalApiClient(sessionToken: string): AxiosInstance {
    const client = axios.create({
        baseURL: process.env.PORTAL_API_URL ?? "http://localhost:3000",
    });

    client.interceptors.request.use(config => {
        config.headers.set("Cookie", `sessionToken=${sessionToken}`);
        return config;
    });

    return addErrorInterceptor(client);
}

export function createPortalApiClient(authToken: string): AxiosInstance {
    const client = axios.create({
        baseURL: process.env.REMOTE_PORTAL_API_URL ?? "https://portal.hamgam-khodro.com:8089/api/",
    });

    client.interceptors.request.use(config => {
        config.headers.set("authenticate", authToken);
        return config;
    });

    return addErrorInterceptor(client);
}

export async function createAuthenticatedPortalApiClient(sessionToken: string): Promise<AxiosInstance> {
    const internalApi = createInternalApiClient(sessionToken);
    const { data } = await internalApi.get<{ Data?: { xToken?: unknown } }>("/api/user-information");
    const authToken = data.Data?.xToken;

    if (typeof authToken !== "string" || !authToken) {
        throw new ApiRequestError("The internal API did not return a portal authentication token");
    }

    return createPortalApiClient(authToken);
}
