-- Server-authoritative draw lock + active draw sequence (replaces in-memory state of the old Socket.IO server)
CREATE TABLE IF NOT EXISTS public.draw_state (
  id           integer PRIMARY KEY CHECK (id = 1),
  data         jsonb,
  started_at   timestamptz,
  locked_until timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.draw_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.draw_state ENABLE ROW LEVEL SECURITY;
