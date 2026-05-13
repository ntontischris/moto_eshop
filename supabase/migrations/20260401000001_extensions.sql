-- Enable pgvector for AI embeddings
create extension if not exists vector;

-- Enable pg_trgm for full-text search trigrams
create extension if not exists pg_trgm;

-- Enable uuid-ossp for uuid generation.
-- Supabase pre-installs this in the `extensions` schema, but all subsequent
-- migrations reference uuid_generate_v4() unqualified. We make sure unqualified
-- calls resolve from any search_path by re-creating it in public.
drop extension if exists "uuid-ossp";
create extension "uuid-ossp" with schema public;
