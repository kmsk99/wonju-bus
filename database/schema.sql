CREATE TABLE IF NOT EXISTS schedule_snapshot (
  id smallint PRIMARY KEY CHECK (id = 1),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  checksum text NOT NULL,
  route_count integer NOT NULL CHECK (route_count > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  checked_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS crawl_runs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  completed_at timestamptz NOT NULL DEFAULT now(),
  route_count integer NOT NULL,
  changed boolean NOT NULL,
  duration_ms integer NOT NULL
);
