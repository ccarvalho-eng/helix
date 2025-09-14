# 🧬 Helix

[![GitHub release](https://img.shields.io/github/v/release/ccarvalho-eng/helix?style=for-the-badge)](https://github.com/ccarvalho-eng/helix/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/ccarvalho-eng/helix/ci.yml?style=for-the-badge&logo=github-actions)](https://github.com/ccarvalho-eng/helix/actions/workflows/ci.yml)
[![E2E Tests](https://img.shields.io/github/actions/workflow/status/ccarvalho-eng/helix/nightly-e2e-tests.yml?style=for-the-badge&logo=playwright&label=E2E)](https://github.com/ccarvalho-eng/helix/actions/workflows/nightly-e2e-tests.yml)
[![codecov](https://img.shields.io/codecov/c/github/ccarvalho-eng/helix?style=for-the-badge&logo=codecov)](https://codecov.io/gh/ccarvalho-eng/helix)
[![Security](https://img.shields.io/github/actions/workflow/status/ccarvalho-eng/helix/security.yml?style=for-the-badge&logo=security&label=Security)](https://github.com/ccarvalho-eng/helix/actions/workflows/security.yml)

A visual workflow designer for AI agents, built with Elixir and Phoenix. Design complex multi-agent workflows using a drag-and-drop interface with real-time collaboration support.

**Key Features:**
- Visual workflow design with node-based interface
- Real-time collaborative editing
- Session management powered by OTP GenServers
- Built for reliability with supervision trees and automatic cleanup

---

## 🚀 Getting Started

### Requirements

- Elixir **1.17+**
- Erlang/OTP **26+**
- Node.js **18+**
- PostgreSQL **14+**

### Installation

```bash
# Clone
git clone https://github.com/ccarvalho-eng/helix.git
cd helix

# Setup
mix setup

# Start
mix phx.server
```

Open: [http://localhost:4000](http://localhost:4000)

### Development

```bash
# Tests
mix test
npm test

# Code quality
mix credo --strict
npm run lint  # Must pass with --max-warnings 0
npm run typecheck

# E2E tests
npm run test:e2e

# Formatting
mix format
npm run prettier
```

## Features

**Visual Design**
- Node-based workflow editor with drag-and-drop interface
- Customizable node types and connections
- Minimap and zoom controls for large workflows

**Collaboration**
- Multi-user editing with WebSocket-based synchronization
- Automatic session management via OTP GenServers
- Conflict resolution using last-write-wins strategy

**Architecture**
- Built on Elixir/OTP for fault tolerance and concurrency
- GraphQL API with Absinthe for flexible data fetching
- Phoenix Channels for real-time communication
- PostgreSQL for persistent storage
- React + TypeScript frontend with comprehensive testing


## Contributing

1. Fork and create a feature branch
2. Make your changes with tests
3. Run the test suite: `mix test && npm test`
4. Submit a pull request

## License

Apache 2.0
