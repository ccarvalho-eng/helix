<div align="center">

# 🧬 Helix

**Visual AI Agent Workflow Designer**

_Plan, design, and visualize complex multi-agent workflows with a clean drag-and-drop interface._

[![GitHub release](https://img.shields.io/github/v/release/ccarvalho-eng/helix?style=for-the-badge)](https://github.com/ccarvalho-eng/helix/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/ccarvalho-eng/helix/ci.yml?style=for-the-badge&logo=github-actions)](https://github.com/ccarvalho-eng/helix/actions/workflows/ci.yml)
[![E2E Tests](https://img.shields.io/github/actions/workflow/status/ccarvalho-eng/helix/nightly-e2e-tests.yml?style=for-the-badge&logo=playwright&label=E2E)](https://github.com/ccarvalho-eng/helix/actions/workflows/nightly-e2e-tests.yml)
[![codecov](https://img.shields.io/codecov/c/github/ccarvalho-eng/helix?style=for-the-badge&logo=codecov)](https://codecov.io/gh/ccarvalho-eng/helix)
[![Security](https://img.shields.io/github/actions/workflow/status/ccarvalho-eng/helix/security.yml?style=for-the-badge&logo=security&label=Security)](https://github.com/ccarvalho-eng/helix/actions/workflows/security.yml)

[Features](#-features) • [Getting Started](#-getting-started) • [Architecture](#-architecture) • [Contributing](#-contributing)

---

</div>

## 🎯 Overview

Helix is a **visual workflow designer for AI agents and multi-agent systems**.
Build complex workflows through an intuitive node editor with collaboration, templates, and real-time updates.

> **Note**: Workflows are for **planning & design only** — not executable yet.

---

## ✨ Features

- **Visual Workflow Design**
  Drag-and-drop interface with customizable nodes, connections, minimap, and properties panel.
- **Collaboration**
  Real-time multi-user editing via Phoenix Channels with conflict resolution.
- **Modern UI/UX**
  Light/dark themes, responsive design, Tailwind styling, robust error boundaries.
- **Workflow Management**
  Save, load, duplicate flows, with metadata and local persistence.

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
npm run lint
npm run typecheck

# E2E tests
npm run test:e2e

# Formatting
mix format
npm run prettier
```

---

## 🛠 Tech Stack

| Layer                 | Stack                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend**           | ![Elixir](https://img.shields.io/badge/Elixir-4B275F?logo=elixir&logoColor=white&style=for-the-badge) ![Phoenix](https://img.shields.io/badge/Phoenix-E95420?logo=phoenixframework&logoColor=white&style=for-the-badge) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white&style=for-the-badge)                                                                                                                                                                                         |
| **Frontend**          | ![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB&style=for-the-badge) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white&style=for-the-badge) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge) ![Lucide Icons](https://img.shields.io/badge/Lucide-000000?logo=lucide&logoColor=white&style=for-the-badge)                                                                           |
| **Testing & Quality** | ![ExUnit](https://img.shields.io/badge/ExUnit-4B275F?logo=elixir&logoColor=white&style=for-the-badge) ![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white&style=for-the-badge) ![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white&style=for-the-badge) ![Credo](https://img.shields.io/badge/Credo-4B275F?logo=elixir&logoColor=white&style=for-the-badge) ![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white&style=for-the-badge) |

---

## 🏗 Architecture

### System Overview

```mermaid
%%{init: {'theme':'dark'}}%%
graph TB
    subgraph "Client Side"
        UA[User A Browser]
        UB[User B Browser]
        FEA[React Frontend<br/>React Flow + TypeScript]
        FEB[React Frontend<br/>React Flow + TypeScript]
        LSA[Local Storage<br/>Flow Data]
        LSB[Local Storage<br/>Flow Data]

        UA --> FEA
        UB --> FEB
        FEA --> LSA
        FEB --> LSB
    end

    subgraph "Network Layer"
        WSA[WebSocket Connection A]
        WSB[WebSocket Connection B]

        FEA -.->|flow_change events| WSA
        FEB -.->|flow_change events| WSB
        WSA -.->|flow_update events| FEA
        WSB -.->|flow_update events| FEB
    end

    subgraph "Phoenix Server"
        FC[FlowChannel<br/>Phoenix Channel]
        FSM[FlowSessionManager<br/>GenServer State]
        API[REST API<br/>Flow CRUD]

        WSA --> FC
        WSB --> FC
        FC <--> FSM
        FC --> API
    end

    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Database)]
        API --> PG
    end
```

### Real-Time Collaboration Flow

```mermaid
%%{init: {'theme':'dark'}}%%
sequenceDiagram
    participant UA as User A
    participant FA as Frontend A
    participant WS as WebSocket
    participant FC as FlowChannel
    participant FSM as FlowSessionManager
    participant FB as Frontend B
    participant UB as User B

    UA->>FA: Create/Edit Node
    FA->>FA: Update Local State
    FA->>WS: Send flow_change event
    WS->>FC: Receive flow_change
    FC->>FSM: broadcast_flow_change()
    FSM->>FSM: Update session state
    FSM->>FC: Broadcast to other clients
    FC->>WS: Send flow_update
    WS->>FB: Receive flow_update
    FB->>FB: Apply remote changes
    FB->>UB: Visual update appears

    Note over FSM: Manages client sessions,<br/>conflict resolution,<br/>and state synchronization
```

- Real-time collaboration through WebSockets + Phoenix Channels
- React Flow for node-based workflow design
- GenServer-based session management with conflict resolution
- RESTful API for workflow CRUD

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
