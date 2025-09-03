# Flow Management Implementation Plan

## Overview
Implement multi-flow management with localStorage storage and real-time synchronization capabilities. Users should be able to create, edit, delete, and duplicate flows while maintaining the current seamless editing experience.

## Current Architecture Analysis
- **Frontend**: React/TypeScript with ReactFlow
- **Storage**: Single localStorage key for all flow data
- **Backend**: Phoenix/Elixir with WebSocket support
- **State Management**: React Flow handles node selection and canvas state

## Core Features Required
- ✅ Multiple flows with unique IDs and editable titles
- ✅ CRUD operations: Create, edit, delete, and duplicate flows
- ✅ localStorage-based storage with flow registry
- ✅ Real-time sync via HTTP + WebSocket (no database persistence)
- ✅ Seamless auto-save without disrupting React Flow selection state
- ✅ Single-user experience that prepares for multi-user collaboration

## Implementation Plan

### 1. Frontend Flow Storage Architecture
- **Flow Registry**: `flows-registry` localStorage key tracking all flows
  ```json
  {
    "flows": [
      {
        "id": "uuid-1",
        "title": "Customer Support Pipeline",
        "lastModified": "2024-01-01T00:00:00Z",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
  ```
- **Individual Flows**: `flow-${id}` keys for each flow's React Flow data
  ```json
  {
    "nodes": [...],
    "edges": [...],
    "viewport": { "x": 0, "y": 0, "zoom": 1 }
  }
  ```
- **Current Flow**: Track active flow ID in URL params and component state

### 2. Home Page Enhancements
- **Flow Grid Display**: Show all flows with title, node count, last modified
- **Flow Actions Menu**: 
  - Edit title inline with auto-save
  - Delete with confirmation modal
  - Duplicate flow with "(Copy)" suffix
  - Open in canvas
- **Create New Flow**: Generate UUID, default title "Untitled Flow"
- **Search/Filter**: Basic search by title functionality

### 3. Canvas Page Updates
- **Editable Title Header**: Inline editing with auto-save on blur/enter
- **Flow Context**: Display current flow info in header
- **Navigation**: Breadcrumb back to home, flow selector dropdown
- **Auto-save Integration**: Preserve existing localStorage auto-save but make it flow-specific

### 4. Backend API (Minimal, No Database)
- **In-memory Flow Sessions**: GenServer to track active flows and connected clients
- **HTTP Endpoints**:
  - `POST /api/flows/:id/sync` - Broadcast flow changes
  - `GET /api/flows/:id/status` - Check if flow has active sessions
- **WebSocket Channels**: 
  - `flow:${id}` channels for real-time updates
  - Join/leave on flow navigation
- **Session Management**: Auto-cleanup inactive sessions after timeout

### 5. Real-time Synchronization
- **Change Detection**: Hook into existing React Flow onChange events
- **HTTP Bridge**: Debounced HTTP calls to backend on flow changes
- **WebSocket Updates**: Receive broadcasts and update localStorage in background
- **State Preservation**: Server updates don't affect current React Flow selection/UI state
- **Conflict Resolution**: Last-write-wins for simplicity

### 6. Flow Operations Implementation

#### Create Flow
1. Generate UUID for new flow
2. Create default flow data structure
3. Add to flows registry
4. Save to localStorage
5. Navigate to canvas page

#### Edit Flow Title
1. Update title in flows registry
2. Save registry to localStorage
3. Broadcast change via HTTP if flow is active
4. Update canvas header if currently viewing flow

#### Delete Flow
1. Show confirmation dialog
2. Remove from flows registry
3. Remove flow-specific localStorage key
4. If currently viewing deleted flow, redirect to home
5. Broadcast deletion to close any active sessions

#### Duplicate Flow
1. Load source flow data
2. Generate new UUID
3. Copy nodes/edges data
4. Create new registry entry with "(Copy)" suffix
5. Save to localStorage
6. Optionally navigate to new flow

### 7. URL Structure and Navigation
- **Home**: `/` - Display flow grid
- **New Flow**: `/flow` - Create new flow and redirect to `/flow/:id`
- **Specific Flow**: `/flow/:id` - Canvas for specific flow
- **Flow Not Found**: Redirect to home with error message

### 8. WebSocket Connection Management
- **Connection Lifecycle**: Connect on flow page load, disconnect on navigation
- **Channel Management**: Join `flow:${id}` channel per flow
- **Cleanup**: Proper socket cleanup on page unload/navigation
- **Reconnection**: Handle connection drops gracefully

### 9. localStorage Schema Migration
- **Backward Compatibility**: Migrate existing single-key data to new structure
- **Migration Function**: Run on app load to convert old format
- **Default Flow**: Convert existing data to "My First Flow" or similar

### 10. Error Handling
- **localStorage Quota**: Handle storage quota exceeded errors
- **Network Failures**: Graceful degradation when backend unavailable
- **Invalid Flow Data**: Recover from corrupted localStorage data
- **Concurrent Updates**: Handle conflicts when multiple tabs open

## Technical Implementation Notes

### React Flow Integration
- Maintain existing `useFlowBuilder` hook pattern
- Extend with flow management capabilities
- Preserve all current React Flow functionality
- Add flow-specific storage methods

### State Management
- No additional state management library needed
- Use React context for flow registry
- Local component state for UI interactions
- localStorage as single source of truth

### Performance Considerations
- Lazy load flow data (don't load all flows at once)
- Debounce auto-save operations
- Efficient flow preview generation
- Memory management for large flows

### Future Enhancements (Out of Scope)
- Database persistence
- Multi-user real-time collaboration
- Version history/undo across sessions
- Flow templates and sharing
- Advanced search and tagging
- Flow analytics and metrics

## Success Criteria
1. Users can create multiple flows from home page
2. Each flow has editable title with auto-save
3. Flows can be deleted with confirmation
4. Flows can be duplicated with new ID
5. Canvas preserves React Flow selection behavior
6. Auto-save works per-flow without disruption
7. Real-time updates work via WebSocket
8. Navigation between flows is seamless
9. localStorage migration handles existing data
10. System is ready for future multi-user features