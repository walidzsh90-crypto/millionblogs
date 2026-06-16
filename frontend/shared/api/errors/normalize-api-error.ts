import { ApiError, type ApiErrorCode, type ApiFieldError } from "./api-error";

type BackendErrorBody = {
  message?: string | string[];
  errors?: ApiFieldError[];
};

function codeFromStatus(status: number): ApiErrorCode {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 422) return "validation";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server";
  return "unknown";
}

export async function normalizeApiError(response: Response): Promise<ApiError> {
  let body: BackendErrorBody | null = null;

  try {
    body = (await response.json()) as BackendErrorBody;
  } catch {
    body = null;
  }

  const message = Array.isArray(body?.message)
    ? body.message.join(", ")
    : body?.message ?? response.statusText ?? "Request failed";

  return new ApiError({
    message,
    status: response.status,
    code: codeFromStatus(response.status),
    fieldErrors: body?.errors,
    requestId: response.headers.get("x-request-id") ?? undefined
  });
}
