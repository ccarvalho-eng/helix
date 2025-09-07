import Config

# Configure your database for e2e tests
config :helix, Helix.Repo,
  username: System.get_env("POSTGRES_USERNAME") || "postgres",
  password: System.get_env("POSTGRES_PASSWORD") || "postgres",
  hostname: "localhost",
  database: "helix_e2e",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

# Configure the endpoint for e2e testing
config :helix, HelixWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4000],
  check_origin: false,
  code_reloader: false,
  debug_errors: false,
  secret_key_base:
    System.get_env("SECRET_KEY_BASE") || Base.encode64(:crypto.strong_rand_bytes(48)),
  server: true

# Disable live reload for e2e tests
config :helix, HelixWeb.Endpoint, live_reload: []

# Disable dev routes for e2e environment
config :helix, dev_routes: false

# Configure logging for e2e tests
config :logger, level: :info
config :logger, :console, format: "[$level] $message\n"

# Set stacktrace depth
config :phoenix, :stacktrace_depth, 20

# Initialize plugs at runtime
config :phoenix, :plug_init_mode, :runtime

# Disable expensive runtime checks for e2e tests
config :phoenix_live_view,
  debug_heex_annotations: false,
  enable_expensive_runtime_checks: false

# Disable swoosh api client
config :swoosh, :api_client, false
