# API Documentation

Helix uses GraphQL for all data operations and Phoenix Channels for real-time collaboration.

## GraphQL API

**Endpoint**: `/api/graphql`

**GraphiQL (Development)**: `/api/graphiql`

### Authentication

Include JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Get token from `login` or `register` mutations.

## Flow Operations

### Queries

#### Get User's Flows

```graphql
query MyFlows {
  myFlows {
    id
    title
    description
    viewportX
    viewportY
    viewportZoom
    version
    isTemplate
    templateCategory
    insertedAt
    updatedAt
  }
}
```

#### Get Single Flow

```graphql
query GetFlow($id: ID!) {
  flow(id: $id) {
    id
    title
    description
    viewportX
    viewportY
    viewportZoom
    version
    nodes {
      id
      nodeId
      type
      positionX
      positionY
      width
      height
      data
    }
    edges {
      id
      edgeId
      sourceNodeId
      targetNodeId
      sourceHandle
      targetHandle
      edgeType
      animated
      data
    }
    insertedAt
    updatedAt
  }
}
```

### Mutations

#### Create Flow

```graphql
mutation CreateFlow($input: CreateFlowInput!) {
  createFlow(input: $input) {
    id
    title
    description
    viewportX
    viewportY
    viewportZoom
    version
    insertedAt
    updatedAt
  }
}
```

**Input**:
```json
{
  "input": {
    "title": "My New Flow",
    "description": "Optional description",
    "viewportX": 0,
    "viewportY": 0,
    "viewportZoom": 1
  }
}
```

#### Update Flow Metadata

```graphql
mutation UpdateFlow($id: ID!, $input: UpdateFlowInput!) {
  updateFlow(id: $id, input: $input) {
    id
    title
    description
    viewportX
    viewportY
    viewportZoom
    version
    updatedAt
  }
}
```

**Input**:
```json
{
  "id": "flow-uuid",
  "input": {
    "title": "Updated Title",
    "description": "Updated description",
    "viewportX": 100,
    "viewportY": 50,
    "viewportZoom": 1.5
  }
}
```

#### Update Flow Data (Nodes and Edges)

```graphql
mutation UpdateFlowData($id: ID!, $input: UpdateFlowDataInput!) {
  updateFlowData(id: $id, input: $input) {
    id
    version
    nodes {
      id
      nodeId
      type
      positionX
      positionY
      width
      height
      data
    }
    edges {
      id
      edgeId
      sourceNodeId
      targetNodeId
      sourceHandle
      targetHandle
      edgeType
      animated
      data
    }
    updatedAt
  }
}
```

**Input**:
```json
{
  "id": "flow-uuid",
  "input": {
    "nodes": [
      {
        "nodeId": "node-1",
        "type": "agent",
        "positionX": 100,
        "positionY": 200,
        "width": 140,
        "height": 80,
        "data": "{\"label\":\"AI Agent\",\"description\":\"\"}"
      }
    ],
    "edges": [
      {
        "edgeId": "edge-1",
        "sourceNodeId": "node-1",
        "targetNodeId": "node-2",
        "sourceHandle": "right",
        "targetHandle": "left",
        "edgeType": "default",
        "animated": false,
        "data": null
      }
    ],
    "version": 1
  }
}
```

**Optimistic Locking**:
- Include current `version` in the input
- If version doesn't match, mutation fails with `version_conflict` error
- Fetch latest version and retry

#### Delete Flow

```graphql
mutation DeleteFlow($id: ID!) {
  deleteFlow(id: $id) {
    id
    title
    deletedAt: updatedAt
  }
}
```

#### Duplicate Flow

```graphql
mutation DuplicateFlow($id: ID!, $title: String) {
  duplicateFlow(id: $id, title: $title) {
    id
    title
    description
    nodes {
      id
      nodeId
      type
      positionX
      positionY
      width
      height
      data
    }
    edges {
      id
      edgeId
      sourceNodeId
      targetNodeId
    }
    insertedAt
    updatedAt
  }
}
```

## WebSocket API

**Endpoint**: `ws://localhost:4000/socket`

### Connection

1. Connect to WebSocket endpoint with authentication:
```javascript
const socket = new Socket('/socket', {
  params: { token: jwt_token }
});
socket.connect();
```

2. Join flow channel:
```javascript
const channel = socket.channel(`flow:${flowId}`, {});
channel.join()
  .receive('ok', () => console.log('Joined'))
  .receive('error', (error) => console.error('Failed', error));
```

### Events

#### Outgoing (Client → Server)

**flow_change**: Broadcast changes to other clients
```javascript
channel.push('flow_change', {
  changes: {
    nodes: [...],
    edges: [...],
    viewport: { x, y, zoom }
  }
});
```

**ping**: Test connection
```javascript
channel.push('ping', {});
```

#### Incoming (Server → Client)

**flow_update**: Receive changes from other clients
```javascript
channel.on('flow_update', (data) => {
  console.log('Received update:', data.changes);
  console.log('Timestamp:', data.timestamp);
});
```

**client_joined**: Another user joined
```javascript
channel.on('client_joined', (data) => {
  console.log('Client count:', data.client_count);
  console.log('Flow ID:', data.flow_id);
});
```

**client_left**: Another user left
```javascript
channel.on('client_left', (data) => {
  console.log('Client count:', data.client_count);
});
```

**flow_deleted**: Flow was deleted
```javascript
channel.on('flow_deleted', (data) => {
  console.log('Flow deleted:', data.flow_id);
  // Redirect to home page
});
```

## Error Handling

### GraphQL Errors

```json
{
  "errors": [
    {
      "message": "Not authenticated",
      "path": ["myFlows"]
    }
  ],
  "data": null
}
```

Common error messages:
- `"Not authenticated"` - Missing or invalid JWT token
- `"Unauthorized"` - User doesn't own the resource
- `"Flow not found"` - Flow ID doesn't exist
- `"Version conflict"` - Optimistic locking failure

### WebSocket Errors

```javascript
channel.join()
  .receive('error', (error) => {
    console.error('Join failed:', error);
    // error.reason contains the error message
  });
```

Common error reasons:
- `"Invalid flow identifier"` - Malformed flow ID
- `"Failed to join flow session"` - Server-side error

## Rate Limiting

Currently no rate limiting is enforced, but this may change in production.

## Data Types

### Node Types

- `agent` - AI agent
- `sensor` - Data input sensor
- `skill` - Skill or capability
- `decision` - Decision point
- `input` - Input node
- `output` - Output node
- `memory` - Memory/storage
- `loop` - Loop control
- `transform` - Data transformation
- `api` - API integration

### Field Naming

- **GraphQL**: camelCase (`nodeId`, `positionX`, `viewportZoom`)
- **Database**: snake_case (`node_id`, `position_x`, `viewport_zoom`)
- Automatic conversion via `Absinthe.Adapter.LanguageConventions`

## Example Usage

### Creating and Updating a Flow

```javascript
// 1. Create flow
const createResult = await client.mutate({
  mutation: CREATE_FLOW,
  variables: {
    input: {
      title: 'Invoice Processing',
      viewportX: 0,
      viewportY: 0,
      viewportZoom: 1
    }
  }
});

const flowId = createResult.data.createFlow.id;
let version = createResult.data.createFlow.version;

// 2. Add nodes and edges
const updateResult = await client.mutate({
  mutation: UPDATE_FLOW_DATA,
  variables: {
    id: flowId,
    input: {
      nodes: [
        {
          nodeId: 'node-1',
          type: 'input',
          positionX: 100,
          positionY: 100,
          width: 100,
          height: 60,
          data: JSON.stringify({ label: 'Invoice Input' })
        }
      ],
      edges: [],
      version: version
    }
  }
});

// 3. Update version for next mutation
version = updateResult.data.updateFlowData.version;

// 4. Connect WebSocket for real-time updates
const socket = new Socket('/socket', {
  params: { token: jwt_token }
});
socket.connect();

const channel = socket.channel(`flow:${flowId}`, {});
channel.join();

// 5. Broadcast changes to other clients
channel.push('flow_change', {
  changes: {
    nodes: [...],
    edges: [...]
  }
});
```
