# Architecture

This document provides detailed technical information about Helix's system architecture, real-time collaboration implementation, and design decisions.

## System Overview

```mermaid
%%{init: {'theme':'neutral'}}%%
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
        HTTP[HTTP/REST Requests]

        FEA -.->|flow_change events| WSA
        FEB -.->|flow_change events| WSB
        WSA -.->|flow_update events| FEA
        WSB -.->|flow_update events| FEB
        FEA -->|CRUD operations| HTTP
        FEB -->|CRUD operations| HTTP
    end

    subgraph "Phoenix Server"
        US[UserSocket<br/>WebSocket Handler]
        FC[FlowChannel<br/>Phoenix Channel]
        FSM[FlowSessionManager<br/>GenServer State]
        PUB[Phoenix.PubSub<br/>Message Broadcasting]
        API[REST API<br/>Flow CRUD]

        WSA --> US
        WSB --> US
        US --> FC
        FC <--> FSM
        FSM --> PUB
        PUB --> FC
        HTTP --> API
    end

    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Database)]
        API --> PG
    end

    classDef client fill:#e3f2fd,stroke:#1976d2,color:#000
    classDef network fill:#f3e5f5,stroke:#7b1fa2,color:#000
    classDef server fill:#e8f5e8,stroke:#388e3c,color:#000
    classDef database fill:#fff3e0,stroke:#f57c00,color:#000
    classDef realtime fill:#ffebee,stroke:#d32f2f,color:#000

    class UA,UB,FEA,FEB,LSA,LSB client
    class WSA,WSB,HTTP network
    class US,API server
    class FC,FSM,PUB realtime
    class PG database
```

## Real-Time Collaboration Flow

```mermaid
%%{init: {'theme':'neutral'}}%%
sequenceDiagram
    participant UA as 👤 User A
    participant FA as 🖥️ Frontend A
    participant WS as 🌐 WebSocket
    participant FC as 📡 FlowChannel
    participant FSM as 🧠 FlowSessionManager
    participant PUB as 📢 Phoenix.PubSub
    participant FB as 🖥️ Frontend B
    participant UB as 👤 User B

    UA->>FA: ✏️ Create/Edit Node
    FA->>FA: 💾 Update Local State
    Note over FA: Debounced (500ms)
    FA->>WS: 📤 Send flow_change event
    WS->>FC: 📥 Receive flow_change
    FC->>FSM: 🚀 broadcast_flow_change()
    FSM->>FSM: ⏰ Update last_activity
    FSM->>PUB: 📡 Phoenix.PubSub.broadcast
    PUB->>FC: 📢 {:flow_change, data}
    FC->>WS: 📤 Send flow_update
    WS->>FB: 📥 Receive flow_update
    FB->>FB: 🔄 Apply remote changes
    FB->>UB: ✨ Visual update appears

    Note over FSM: 📋 Manages client sessions<br/>⏰ Updates activity timestamps<br/>❌ No conflict resolution
    Note over PUB: 🚀 Handles message broadcasting<br/>📡 Topic: "flow:#{flow_id}"
```

## WebSocket Conflict Resolution

```mermaid
%%{init: {'theme':'neutral'}}%%
flowchart TD
    A[Client A: flow_change] --> B{Connection Status}
    A2[Client B: flow_change<br/>⚡ Concurrent Event] --> B2{Connection Status}

    B -->|Connected| C[FlowChannel handles A]
    B -->|Disconnected| D[❌ Event Lost<br/>No Queuing]

    B2 -->|Connected| C2[FlowChannel handles B]
    B2 -->|Disconnected| D2[❌ Event Lost<br/>No Queuing]

    C --> E[FlowSessionManager.broadcast_flow_change]
    C2 --> E2[FlowSessionManager.broadcast_flow_change]

    E --> F{Active Session?}
    E2 --> F2{Active Session?}

    F -->|Yes| G[✅ Broadcast A to all clients<br/>Last-Write-Wins]
    F -->|No| H[⚠️ Log: No session found]

    F2 -->|Yes| G2[✅ Broadcast B to all clients<br/>⚡ Overwrites A's changes]
    F2 -->|No| H2[⚠️ Log: No session found]

    G --> I[Phoenix.PubSub broadcast]
    G2 --> I2[Phoenix.PubSub broadcast]
    H --> K[❌ Changes discarded]
    H2 --> K2[❌ Changes discarded]

    I --> J[All clients receive A]
    I2 --> J2[All clients receive B<br/>🔄 Conflicts possible]

    J --> L[Frontend applies A]
    J2 --> L2[Frontend applies B<br/>May overwrite A]

    subgraph "Connection Handling"
        M[Connection Lost] --> N{Reconnection?}
        N -->|Success| O[Auto-rejoin channel<br/>🔄 No state sync]
        N -->|Failed| P[Exponential backoff]
        P --> Q{Max attempts<br/>10 retries?}
        Q -->|No| R[Wait + retry]
        Q -->|Yes| S[❌ Give up]
        R --> N
        O --> T[Resume sending events]
    end

    classDef error fill:#ffebee,stroke:#d32f2f,color:#000
    classDef success fill:#e8f5e8,stroke:#388e3c,color:#000
    classDef warning fill:#fff3e0,stroke:#f57c00,color:#000
    classDef conflict fill:#f3e5f5,stroke:#7b1fa2,color:#000
    classDef info fill:#e3f2fd,stroke:#1976d2,color:#000

    class D,D2,H,H2,K,K2,S error
    class G,G2,I,I2,O,T success
    class P,R warning
    class A2,G2,I2,J2,L2 conflict
    class F,F2,N,Q info
```

## Conflict Resolution Strategy

- **No validation**: All changes are accepted and broadcasted immediately
- **Last-Write-Wins**: Concurrent changes overwrite each other
- **No queuing**: Disconnected events are lost (not queued for later)
- **No state sync**: Reconnected clients don't get missed changes
- **Session-based**: Only active sessions (with connected clients) receive broadcasts

## Key Components

### FlowSessionManager GenServer

The `FlowSessionManager` is a GenServer process that maintains workflow sessions in memory:

- Tracks active flow sessions and connected clients
- Handles automatic cleanup of inactive sessions (30-minute timeout)
- Manages session lifecycle and client join/leave operations
- Broadcasts flow changes to all connected clients in a session

### Phoenix Channels

Real-time communication is handled through Phoenix Channels:

- `FlowChannel` manages WebSocket connections for each workflow
- Handles `flow_change` events from clients
- Broadcasts `flow_update` events to all connected clients
- Uses Phoenix PubSub for message distribution

### Local Storage Persistence

Currently, workflows are persisted in browser localStorage:

- Each workflow has a unique ID and metadata
- Flow data includes nodes, edges, and viewport state
- Registry tracks all workflows with timestamps and counts
- Automatic saving on every change with debouncing

## Technology Stack

- **Backend**: Elixir 1.17+, Phoenix Framework, Absinthe (GraphQL)
- **Frontend**: React, TypeScript, React Flow, TailwindCSS
- **Database**: PostgreSQL 14+ (development setup)
- **Real-time**: Phoenix Channels, WebSockets
- **State Management**: OTP GenServers, Phoenix PubSub
- **Testing**: ExUnit, Jest, Playwright