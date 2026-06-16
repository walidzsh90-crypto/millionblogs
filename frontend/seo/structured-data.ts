export type JsonLdObject = Record<string, unknown>;

export function createJsonLdScript(data: JsonLdObject): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
