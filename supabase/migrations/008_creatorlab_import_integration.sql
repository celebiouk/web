CREATE TABLE IF NOT EXISTS public.creatorlab_oauth_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  account_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  scope TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creatorlab_oauth_codes_account
  ON public.creatorlab_oauth_codes(account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_creatorlab_oauth_codes_expires
  ON public.creatorlab_oauth_codes(expires_at);

CREATE TABLE IF NOT EXISTS public.creatorlab_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token_hash TEXT UNIQUE NOT NULL,
  refresh_token_hash TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL,
  account_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  scope TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  refresh_expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creatorlab_oauth_tokens_access
  ON public.creatorlab_oauth_tokens(access_token_hash);

CREATE INDEX IF NOT EXISTS idx_creatorlab_oauth_tokens_refresh
  ON public.creatorlab_oauth_tokens(refresh_token_hash);

CREATE INDEX IF NOT EXISTS idx_creatorlab_oauth_tokens_account
  ON public.creatorlab_oauth_tokens(account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.creatorlab_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  external_source TEXT NOT NULL CHECK (external_source = 'creatorlab'),
  external_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  content JSONB NOT NULL DEFAULT '{}',
  assets JSONB NOT NULL DEFAULT '{}',
  options JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'ready', 'failed')),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  correlation_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, external_source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_creatorlab_imports_account
  ON public.creatorlab_imports(account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_creatorlab_imports_status
  ON public.creatorlab_imports(status, updated_at DESC);

ALTER TABLE public.creatorlab_oauth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creatorlab_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creatorlab_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage creatorlab oauth codes" ON public.creatorlab_oauth_codes
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage creatorlab oauth tokens" ON public.creatorlab_oauth_tokens
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage creatorlab imports" ON public.creatorlab_imports
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Accounts can view own creatorlab imports" ON public.creatorlab_imports
  FOR SELECT USING (account_id = auth.uid());