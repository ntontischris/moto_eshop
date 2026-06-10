-- Storage bucket for mirrored product images (ADR 0005 — image evacuation).
-- Public read so URLs render directly through the Next.js optimizer; writes go
-- through the mirror script with the service-role key (bypasses RLS), so no
-- extra storage.objects policies are needed. Mirrors the campaign-images setup.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
