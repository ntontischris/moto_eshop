-- Function: create profile on new user signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into user_profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger: fire after insert into auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
