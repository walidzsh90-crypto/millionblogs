export type ApiErrorCode =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "server"
  | "network"
  | "unknown";

export type ApiFieldError = {
  field: string;
  message: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly fieldErrors: ApiFieldError[];
  readonly requestId?: string;

  constructor(params: {
    message: string;
    status: number;
    code: ApiErrorCode;
    fieldErrors?: ApiFieldError[];
    requestId?: string;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.code = params.code;
    this.fieldErrors = params.fieldErrors ?? [];
    this.requestId = params.requestId;
  }
}
