-- What the Monitor screens display: 'event' (booth lucky draw) or 'namespin' (name wheel).
-- Display state only (wheel names sample, title, prize) — no draw results are stored.
CREATE TABLE IF NOT EXISTS public.monitor_state (
  id         integer PRIMARY KEY CHECK (id = 1),
  mode       varchar(20) NOT NULL DEFAULT 'event' CHECK (mode IN ('event', 'namespin')),
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.monitor_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.monitor_state ENABLE ROW LEVEL SECURITY;
