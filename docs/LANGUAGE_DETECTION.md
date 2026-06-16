# Language Detection

## Strategy

Language detection uses a 3-tier fallback approach:

### Tier 1: Primary Language (from RSS)

If the RSS feed declares a `<language>` element, that value is used with high confidence (0.9).

### Tier 2: Content Detection

The title and excerpt are scored against language-specific patterns using stop-word frequency analysis.

**Supported languages for detection:**
- English (en)
- Spanish (es)
- French (fr)
- German (de)

**How it works:**
1. Concatenate title + excerpt
2. Count matches against known stop-word patterns for each language
3. Calculate ratio: `matches / total_words`
4. Select language with highest score above 0.3 threshold

**Example scoring:**
```
Text: "The quick brown fox jumps over the lazy dog"
English matches: 9 (the=2, over=1, the=1, lazy=1, dog=1, fox=1, jumps=1)
Spanish matches: 1 (the is not Spanish)
→ English wins with score ~0.9
```

### Tier 3: Fallback

If text is too short (< 20 characters) or no language scores above threshold:
- Default to English
- Low confidence (0.3)

## Language Confidence

| Source    | Confidence        |
|-----------|-------------------|
| Primary   | 0.9               |
| Detected  | 0.3 - 1.0         |
| Fallback  | 0.3               |

## Stored Fields

```prisma
language           String   @default("en")
languageConfidence Float?   @map("language_confidence")
```

## Supported Language Codes

en, es, fr, de, pt, it, nl, ru, ja, ko, zh, ar, hi, tr, pl, sv, da, fi, nb, cs, hu, ro, uk, el, he, th, vi
