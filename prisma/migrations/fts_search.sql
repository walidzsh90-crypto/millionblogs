-- Full Text Search Migration
-- Adds tsvector columns and GIN indexes for PostgreSQL full text search

-- 1. Add tsvector column to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tsv_article tsvector;

-- 2. Add tsvector column to blogs table
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS tsv_blog tsvector;

-- 3. Create GIN indexes
CREATE INDEX IF NOT EXISTS idx_articles_tsv ON articles USING GIN(tsv_article);
CREATE INDEX IF NOT EXISTS idx_blogs_tsv ON blogs USING GIN(tsv_blog);

-- 4. Create trigger function for articles
CREATE OR REPLACE FUNCTION articles_tsv_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.tsv_article :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger function for blogs
CREATE OR REPLACE FUNCTION blogs_tsv_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.tsv_blog :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create triggers
DROP TRIGGER IF EXISTS trg_articles_tsv ON articles;
CREATE TRIGGER trg_articles_tsv
  BEFORE INSERT OR UPDATE OF title, excerpt
  ON articles
  FOR EACH ROW
  EXECUTE FUNCTION articles_tsv_trigger();

DROP TRIGGER IF EXISTS trg_blogs_tsv ON blogs;
CREATE TRIGGER trg_blogs_tsv
  BEFORE INSERT OR UPDATE OF name, description
  ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION blogs_tsv_trigger();

-- 7. Backfill existing records
UPDATE articles SET tsv_article =
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(excerpt, '')), 'B')
WHERE tsv_article IS NULL;

UPDATE blogs SET tsv_blog =
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B')
WHERE tsv_blog IS NULL;

-- 8. Create search analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query VARCHAR(500) NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  language VARCHAR(10) NOT NULL DEFAULT 'all',
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_ms INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_search_analytics_searched_at ON search_analytics(searched_at);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_language ON search_analytics(language);
