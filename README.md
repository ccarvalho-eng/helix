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

> ⚠️ Early Development
>
> - Visual design and planning only — workflows are not executable yet.
> - Workflows are stored in the browser's localStorage (no sync/backups). Clearing browser data or switching devices will lose unsaved workflows.
> - Server-side persistence and execution are planned for future releases.

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
- Real-time sync via WebSockets
  - Last-write-wins: concurrent edits may overwrite each other
  - No queuing: edits made while disconnected are lost and not replayed on reconnect
  - No state resync: reconnecting clients do not receive missed changes
  - No granular access control: assume all connected users with the link can edit
  - Recommendation: coordinate edits or duplicate flows to avoid unintended overwrites
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

## Documentation

- [Architecture](docs/architecture.md) - Technical details and system diagrams

## License

Apache 2.0

---

⭐ **[Star this repo](https://github.com/ccarvalho-eng/helix)** to support development and help others discover it!
