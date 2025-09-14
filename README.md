<div align="center">

# 🧬 Helix

**AI Workflow Builder for Elixir**

_Build robust AI agent workflows with real-time collaboration, powered by OTP fault-tolerance._

[![GitHub release](https://img.shields.io/github/v/release/ccarvalho-eng/helix?style=for-the-badge)](https://github.com/ccarvalho-eng/helix/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/ccarvalho-eng/helix/ci.yml?style=for-the-badge&logo=github-actions)](https://github.com/ccarvalho-eng/helix/actions/workflows/ci.yml)
[![codecov](https://img.shields.io/codecov/c/github/ccarvalho-eng/helix?style=for-the-badge&logo=codecov)](https://codecov.io/gh/ccarvalho-eng/helix)

[Getting Started](#-getting-started) • [Features](#-features) • [Contributing](#-contributing)

---

</div>

Helix is a **visual AI workflow builder** that leverages Elixir's OTP architecture for robust, fault-tolerant workflow design. Unlike traditional workflow tools, Helix provides real-time collaboration through supervised GenServer processes and Phoenix Channels, ensuring your workflow sessions are resilient and automatically managed.

**Why Helix?**
- **Fault-Tolerant**: Built on OTP supervision trees with automatic session cleanup and error recovery
- **Real-Time Collaboration**: Live multi-user editing with conflict-free synchronization
- **Production-Ready**: Elixir's battle-tested concurrency model handles thousands of concurrent workflow sessions
- **Developer-Friendly**: Clean drag-and-drop interface with full TypeScript support

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

## ✨ Features

- **🎨 Visual Workflow Design** - Intuitive drag-and-drop interface with customizable nodes and connections
- **👥 Real-Time Collaboration** - Live multi-user editing with automatic conflict resolution
- **⚡ Fault-Tolerant Backend** - OTP supervision trees ensure session reliability and automatic recovery
- **🚀 Production-Ready** - Built on Phoenix/Elixir for handling thousands of concurrent users
- **💾 Auto-Save Sessions** - GenServer automatically saves changes and manages session lifecycle
- **🎯 Developer Experience** - Full TypeScript support with comprehensive testing

## 🏗 Architecture

**OTP-Powered Session Management**
- `FlowSessionManager` GenServer maintains workflow sessions with automatic cleanup
- Supervised process tree ensures fault tolerance and graceful error recovery
- Phoenix Channels provide real-time collaboration with last-write-wins conflict resolution
- PostgreSQL persistence with local storage fallback

**Tech Stack**
- **Backend:** Elixir, Phoenix, PostgreSQL
- **Frontend:** React, TypeScript, TailwindCSS, React Flow
- **Testing:** ExUnit, Jest, Playwright, E2E automation

---

## 🤝 Contributing

1. Fork & branch (`git checkout -b feature/amazing-feature`)
2. Add changes + tests
3. Run full test suite (`npm run test:all && mix test`)
4. Commit using [Conventional Commits](https://conventionalcommits.org/)
5. Open a pull request

See [Contributing Guide](CONTRIBUTING.md) for details.

---

## 📝 License

Apache 2.0 — see [LICENSE](LICENSE).

---

<div align="center">

⭐ If you find Helix useful, [give it a star](https://github.com/ccarvalho-eng/helix/stargazers).

Built with ❤️ for the AI community.

</div>
