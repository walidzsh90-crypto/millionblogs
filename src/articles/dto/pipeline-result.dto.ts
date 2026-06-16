export class PipelineResultDto {
  articleId: string;
  feedEntryId: string;
  title: string;
  slug: string;
  status: string;
  validationPassed: boolean;
  validationErrors: string[];
  normalizationApplied: string[];
  deduplicationResult: string;
  languageDetected: string;
  languageConfidence: number | null;
  categoriesAssigned: string[];
  published: boolean;

  static fromData(data: {
    articleId: string;
    feedEntryId: string;
    title: string;
    slug: string;
    status: string;
    validationPassed: boolean;
    validationErrors: string[];
    normalizationApplied: string[];
    deduplicationResult: string;
    languageDetected: string;
    languageConfidence: number | null;
    categoriesAssigned: string[];
    published: boolean;
  }): PipelineResultDto {
    return { ...data };
  }
}
