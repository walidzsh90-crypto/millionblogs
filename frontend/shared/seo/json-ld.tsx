import { createJsonLdScript, type JsonLdObject } from "@/seo/structured-data";

export function JsonLd({ data }: { data: JsonLdObject }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: createJsonLdScript(data) }} />;
}
