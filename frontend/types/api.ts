export type ApiId = string;

export type ApiTimestamp = string;

export type ApiSoftDelete = {
  deletedAt?: ApiTimestamp | null;
};
