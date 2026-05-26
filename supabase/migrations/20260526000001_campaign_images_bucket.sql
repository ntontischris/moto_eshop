-- Storage bucket for campaign hero / editorial images uploaded from the admin.
-- Public read so URLs render directly; writes go through a server action with
-- the service-role key (bypasses RLS), so no extra storage.objects policies
-- are needed for our use case.

insert into storage.buckets (id, name, public)
values ('campaign-images', 'campaign-images', true)
on conflict (id) do nothing;
