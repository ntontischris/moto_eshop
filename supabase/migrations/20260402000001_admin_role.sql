-- Add admin role to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin', 'super_admin'));

-- Index for quick admin lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles (role)
  WHERE role IN ('admin', 'super_admin');
