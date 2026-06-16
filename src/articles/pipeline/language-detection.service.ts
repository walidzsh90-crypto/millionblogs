import { Injectable } from '@nestjs/common';

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  source: 'primary' | 'detected' | 'fallback';
}

@Injectable()
export class LanguageDetectionService {
  private readonly languagePatterns: Record<string, RegExp[]> = {
    en: [/\b(the|and|of|to|a|in|is|it|you|that|he|was|for|on|are|with|as|his|they|at|be|this|from|or|an|will|would|can|could|has|have|had|not|but|what|all|were|when|we|their|there|about|up|out|them|then|she|her|some|would|make|like|into|than|who|now|over|new|more|these|people|also|very|just|after|only|other|our|well|way|even|much|because|how|which|back|here|such|each|those|most)\b/gi],
    es: [/\b(que|los|las|del|con|una|para|como|más|pero|sus|entre|era|estar|tiene|muy|este|sobre|parte|donde|este|otro|eso|todo|dos|hay|sin|nuevo|también|vez|desde|gran|hasta|solo|forma|caso|tanto|grupo|buen|luego|nunca|tres|propio|mejor|así|menos|otra|mayor|nada|tipo|antes|siempre|orden|general|tema|valor|tener|partir|modo|vida|tiempo|manera|mundo|año|país|algo|día|noche|agua|ejemplo|nombre|final|millones)\b/gi],
    fr: [/\b(les|des|dans|une|pour|plus|avec|sont|fait|mais|sur|comme|tout|leur|être|avoir|faire|autre|entre|temps|monde|aussi|tous|deux|grand|partie|pendant|avant|même|sans|sous|chaque|encore|telle|depuis|point|peut|bien|très|alors|donc|cette|façon|cours|souvent|notre|leurs|enfin|nombre|contre|toujours|personne|ensemble|ainsi|quelque|autre|besoin|moins|mieux|suite|trop|peu|vraiment|parce|assez|voire|sauf|jamais|autant|divers|plusieurs|grâce|quel|quels|quelle|quelles)\b/gi],
    de: [/\b(der|die|das|und|den|von|mit|dem|auf|für|sind|aus|bei|auch|nur|nach|dass|über|einen|wird|sich|haben|durch|gegen|einer|dieser|wieder|zwischen|sehr|immer|zwei|groß|weit|neue|ganze|heute|wollen|sollen|können|müssen|dürfen|werden|waren|hatte|seine|ihre|seinem|diesem|dieses|dieser|unser|eure|kein|keine|keinen|solche|welche|manchem|manche|solchem|solchen|solcher)\b/gi],
  };

  detect(
    title: string,
    excerpt: string | null,
    primaryLanguage?: string | null,
  ): LanguageDetectionResult {
    // Priority 1: Use primary language from RSS if available
    if (primaryLanguage && this.isValidLanguage(primaryLanguage)) {
      return {
        language: primaryLanguage,
        confidence: 0.9,
        source: 'primary',
      };
    }

    // Priority 2: Detect from text content
    const text = `${title} ${excerpt || ''}`.toLowerCase();
    if (text.length > 20) {
      const scores = this.scoreLanguages(text);
      const top = scores[0];
      if (top && top.score > 0.3) {
        return {
          language: top.language,
          confidence: top.score,
          source: 'detected',
        };
      }
    }

    // Priority 3: Fallback to English
    return {
      language: 'en',
      confidence: 0.3,
      source: 'fallback',
    };
  }

  private scoreLanguages(text: string): Array<{ language: string; score: number }> {
    const scores: Array<{ language: string; score: number }> = [];
    const words = text.split(/\s+/).length;

    for (const [lang, patterns] of Object.entries(this.languagePatterns)) {
      let matches = 0;
      for (const pattern of patterns) {
        const found = text.match(pattern);
        if (found) matches += found.length;
      }
      const score = words > 0 ? matches / words : 0;
      scores.push({ language: lang, score });
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  private isValidLanguage(lang: string): boolean {
    const valid = [
      'en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'ru', 'ja', 'ko', 'zh',
      'ar', 'hi', 'tr', 'pl', 'sv', 'da', 'fi', 'nb', 'cs', 'hu', 'ro',
      'uk', 'el', 'he', 'th', 'vi',
    ];
    return valid.includes(lang.toLowerCase());
  }
}
