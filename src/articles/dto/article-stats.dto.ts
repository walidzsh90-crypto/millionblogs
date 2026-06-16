export class ArticleStatsDto {
  total: number;
  drafts: number;
  processing: number;
  published: number;
  rejected: number;
  archived: number;
  totalViews: number;
  totalClicks: number;
  averageCtr: number;
  languages: Record<string, number>;

  static fromData(data: {
    total: number;
    drafts: number;
    processing: number;
    published: number;
    rejected: number;
    archived: number;
    totalViews: number;
    totalClicks: number;
    averageCtr: number;
    languages: Record<string, number>;
  }): ArticleStatsDto {
    return { ...data };
  }
}
