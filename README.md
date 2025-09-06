<div align="center">

# 🧬 Helix

**Visual AI Agent Workflow Designer**

_Plan, design, and visualize complex AI agent workflows with intuitive drag-and-drop interface_

[![GitHub release](https://img.shields.io/github/v/release/ccarvalho-eng/helix?style=for-the-badge)](https://github.com/ccarvalho-eng/helix/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/ccarvalho-eng/helix/ci.yml?style=for-the-badge&logo=github-actions)](https://github.com/ccarvalho-eng/helix/actions/workflows/ci.yml)
[![codecov](https://img.shields.io/codecov/c/github/ccarvalho-eng/helix?style=for-the-badge&logo=codecov)](https://codecov.io/gh/ccarvalho-eng/helix)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge)](https://www.apache.org/licenses/LICENSE-2.0)

[Features](#-features) • [Getting Started](#-getting-started) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

---

</div>

## 🎯 Overview

Helix is a modern visual workflow designer specifically built for planning AI agent interactions and multi-agent systems. Design complex workflows with an intuitive node-based interface, complete with real-time collaboration features and pre-built templates.

> **Note**: Helix is currently a planning and design tool. Workflows are visual representations and not executable at this time.

## ✨ Features

### 🎨 **Visual Workflow Design**

- Drag-and-drop node-based interface powered by React Flow
- Customizable node types for different AI agent roles
- Visual connections showing agent interactions and data flow
- Intuitive properties panels for node configuration
- Minimap navigation and zoom controls

### 🤝 **Real-Time Collaboration**

- Multiple users can edit workflows simultaneously
- Phoenix Channels for real-time WebSocket communication
- Automatic conflict resolution for concurrent edits
- Session management with unique client IDs

### 🌗 **Modern UI/UX**

- Dark and light theme support with smooth transitions
- Responsive design for desktop and tablet devices
- Professional styling with Tailwind CSS
- Error boundaries for robust error handling

### 💾 **Workflow Management**

- Create, save, and load workflow configurations
- Flow duplication with proper ID remapping
- Local storage persistence
- Flow metadata tracking (creation date, modification time, node/edge counts)

## 🚀 Getting Started

### Prerequisites

- **Elixir** 1.17+
- **Erlang/OTP** 26+
- **Node.js** 18+
- **PostgreSQL** 14+

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ccarvalho-eng/helix.git
   cd helix
   ```

2. **Install dependencies**

   ```bash
   mix setup
   ```

3. **Start the development server**

   ```bash
   mix phx.server
   ```

4. **Open your browser**

   Navigate to [`http://localhost:4000`](http://localhost:4000)

### Development Commands

```bash
# Run tests
mix test
npm test

# Code quality checks
mix credo --strict
npm run lint
npm run typecheck

# End-to-end tests
npm run test:e2e

# Format code
mix format
npm run prettier
```

## 🛠 Tech Stack

### Backend

- **[Phoenix Framework](https://phoenixframework.org/)** - Web framework
- **[Elixir](https://elixir-lang.org/)** - Functional programming language
- **[PostgreSQL](https://postgresql.org/)** - Database
- **[Phoenix Channels](https://hexdocs.pm/phoenix/channels.html)** - Real-time WebSocket communication

### Frontend

- **[React](https://react.dev/)** - UI framework (v19.1+)
- **[TypeScript](https://typescriptlang.org/)** - Type safety
- **[React Flow](https://reactflow.dev/)** - Node-based UI components
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Lucide Icons](https://lucide.dev/)** - Icon library

### Testing & Quality

- **[ExUnit](https://hexdocs.pm/ex_unit/)** - Elixir testing
- **[Jest](https://jestjs.io/)** - JavaScript testing
- **[Playwright](https://playwright.dev/)** - E2E testing
- **[Credo](https://hex.pm/packages/credo)** - Code analysis
- **[ESLint](https://eslint.org/)** - JavaScript linting

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

### Key Architecture Components

- **Real-time collaboration** via Phoenix Channels and WebSocket connections
- **Component-based** React architecture with TypeScript for type safety
- **Node-based workflow** representation using React Flow library
- **GenServer-based session management** for multi-user state coordination
- **Client-side persistence** with localStorage for offline capability
- **Conflict resolution** handled by FlowSessionManager GenServer
- **RESTful API endpoints** for flow CRUD operations

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm run test:all && mix test`
5. Commit using [Conventional Commits](https://conventionalcommits.org/)
6. Push to your fork and submit a pull request

## 📝 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Phoenix Framework](https://phoenixframework.org/) for the robust backend foundation
- [React Flow](https://reactflow.dev/) for the excellent node-based UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first styling approach

---

<div align="center">

**[⭐ Star this repo](https://github.com/ccarvalho-eng/helix/stargazers) if you find it useful!**

Made with ❤️ for the AI community

</div>
