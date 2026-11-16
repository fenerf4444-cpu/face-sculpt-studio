CREATE TABLE public.session_ai_guard (key text PRIMARY KEY, window_start timestamptz NOT NULL DEFAULT now(), requests integer NOT NULL DEFAULT 0, denied_reason text);
GRANT ALL ON public.session_ai_guard TO service_role;
ALTER TABLE public.session_ai_guard ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.reserve_session_generation(client_key text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE allowed boolean;
BEGIN
INSERT INTO public.session_ai_guard(key, requests) VALUES (client_key, 1)
ON CONFLICT(key) DO UPDATE SET requests = CASE WHEN session_ai_guard.window_start < now() - interval '1 hour' THEN 1 ELSE session_ai_guard.requests + 1 END, window_start = CASE WHEN session_ai_guard.window_start < now() - interval '1 hour' THEN now() ELSE session_ai_guard.window_start END
RETURNING requests <= 6 INTO allowed;
RETURN allowed;
END; $$;
REVOKE ALL ON FUNCTION public.reserve_session_generation(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_session_generation(text) TO service_role;