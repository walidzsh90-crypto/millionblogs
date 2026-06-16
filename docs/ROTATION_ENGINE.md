# Rotation Engine

## Purpose

The Rotation Engine ensures fair distribution of promotion visibility across all active campaigns.

## Algorithm

Campaigns are scored using three weighted factors:

### 1. Campaign Weight × Package Priority
```
base = campaign.weight * package.priority
```

### 2. Impression Balance (fairness)
```
impressionFactor = 1 / (1 + log(impressions))
```
Campaigns with fewer impressions get a boost to ensure fair rotation.

### 3. Budget Remaining
```
budgetFactor = (budget - spent) / budget
```
Campaigns with more remaining budget are prioritized (budget-aware rotation).

### Final Score
```
score = base * impressionFactor * budgetFactor
```

## Key Design Decisions

- **No permanent top positions**: The impression factor ensures that once a campaign gets many views, its score decreases, allowing others to rotate in
- **Weighted rotation**: Higher-weight campaigns get more impressions but don't dominate permanently
- **Budget awareness**: Campaigns near their budget limit get deprioritized to avoid spending remaining credits on low-value impressions
- **Type filtering**: Article and Showcase promotions are rotated independently

## Output

Returns top N campaigns for the requested type, sorted by score descending:

```typescript
interface RotationResult {
  campaignId: string;
  type: string;
  targetId: string | null;
  weight: number;
  impressions: number;
  packageName: string;
}
```

## Scalability

The current implementation loads all active campaigns into memory and scores them. For Phase 12 MVP this is sufficient. For future scaling:

- Add Redis caching of active campaign scores
- Implement paginated rotation with score precomputation
- Use PostgreSQL window functions for database-side scoring
