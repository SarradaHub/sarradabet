-- Created automatically on first Postgres container init (docker-compose db service).
SELECT 'CREATE DATABASE sarradabet_test'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'sarradabet_test'
)\gexec
