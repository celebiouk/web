-- Remove all CreatorLab integration objects.
-- Cele.bio is no longer partnered with CreatorLab.

DROP TABLE IF EXISTS public.creatorlab_imports CASCADE;
DROP TABLE IF EXISTS public.creatorlab_oauth_tokens CASCADE;
DROP TABLE IF EXISTS public.creatorlab_oauth_codes CASCADE;
