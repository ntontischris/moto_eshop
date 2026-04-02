-- Enable pgvector for AI embeddings
create extension if not exists vector;

-- Enable pg_trgm for full-text search trigrams
create extension if not exists pg_trgm;

-- Enable uuid-ossp for uuid generation
create extension if not exists "uuid-ossp";
