<div align="center">

# 🧬 Helix

**Visual workflow editor for AI agent systems**

[![GitHub release](https://img.shields.io/github/v/release/ccarvalho-eng/helix?style=flat-square)](https://github.com/ccarvalho-eng/helix/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/ccarvalho-eng/helix/ci.yml?style=flat-square&logo=github-actions)](https://github.com/ccarvalho-eng/helix/actions)
[![E2E Tests](https://img.shields.io/github/actions/workflow/status/ccarvalho-eng/helix/nightly-e2e-tests.yml?style=flat-square&logo=playwright&label=E2E)](https://github.com/ccarvalho-eng/helix/actions)
[![Coverage](https://img.shields.io/codecov/c/github/ccarvalho-eng/helix?style=flat-square)](https://codecov.io/gh/ccarvalho-eng/helix)
[![Security](https://img.shields.io/github/actions/workflow/status/ccarvalho-eng/helix/security.yml?style=flat-square&label=Security)](https://github.com/ccarvalho-eng/helix/actions)

</div>

Create and collaborate on AI workflow diagrams with real-time editing. Built with Elixir/Phoenix and React.

> **⚠️ Early Development**: Currently focused on visual design and planning. Workflows are stored in browser localStorage. PostgreSQL persistence and execution coming in future releases.

## Quick Start

```bash
git clone https://github.com/ccarvalho-eng/helix.git
cd helix
mix setup
mix phx.server
```

Open [localhost:4000](http://localhost:4000) and start designing workflows.

**Requirements:** Elixir 1.17+, Erlang/OTP 26+, Node.js 18+, PostgreSQL 14+ (for development)

## What it does

- Drag and drop nodes to create workflow diagrams
- Connect nodes to show how agents interact
- Multiple people can edit the same workflow simultaneously
- Changes sync in real-time via WebSockets
- Sessions are managed by Elixir GenServers
- Export diagrams as PNG images

## Development

```bash
mix test && npm test      # run all tests
mix credo --strict        # code quality
npm run test:e2e          # end-to-end tests
```

## Contributing

- 🐛 **[Report bugs](https://github.com/ccarvalho-eng/helix/issues)** with reproduction steps
- 💡 **[Request features](https://github.com/ccarvalho-eng/helix/discussions)** and share use cases
- 🔧 **[Submit code](https://github.com/ccarvalho-eng/helix/pulls)** with tests and documentation

See our [contributing guide](CONTRIBUTING.md) for more details.

## License

Apache 2.0

---

⭐ **[Star this repo](https://github.com/ccarvalho-eng/helix)** to support development and help others discover it!
