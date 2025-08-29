# AI Flow Templates

This directory contains pre-built AI flow templates that users can quickly add to their canvas.

## Adding a New Template

To add a new template, follow these steps:

1. **Create a new template file** in this directory (e.g., `my-template.ts`)
2. **Define the template** following the `Template` interface structure
3. **Add it to the registry** in `registry.ts`
4. **Update the types** in `types.ts` if needed

## Template Structure

Each template should have:

- **id**: Unique identifier for the template
- **name**: Display name shown in the UI
- **description**: Brief description of what the template does
- **nodes**: Array of nodes with positions and configurations
- **connections**: Array of connections between nodes

## Example

```typescript
import { Template } from './types';

export const myTemplate: Template = {
  id: 'my-template',
  name: 'My Template',
  description: 'Description of what this template does',
  nodes: [
    { id: 'input-1', type: 'input', label: 'Input', description: 'Input description', x: 100, y: 100 },
    // ... more nodes
  ],
  connections: [
    { source: 'input-1', target: 'node-1', sourceHandle: 'right', targetHandle: 'left' },
    // ... more connections
  ],
};
```

## Node Types

Available node types:
- `input`: Starting point for the flow
- `sensor`: Data input or monitoring
- `agent`: AI agent that processes data
- `skill`: Specific capability or function
- `decision`: Conditional logic or branching
- `output`: Final result or endpoint

## Adding to Registry

After creating your template, add it to `registry.ts`:

```typescript
import { myTemplate } from './my-template';

export const templateRegistry: Record<TemplateType, Template> = {
  'assassins-creed': assassinsCreedTemplate,
  'lotr': lordOfTheRingsTemplate,
  'my-template': myTemplate, // Add your template here
};
```

## Updating Types

If you add a new template, update the `TemplateType` in `types.ts`:

```typescript
export type TemplateType = 'assassins-creed' | 'lotr' | 'my-template';
```

## Current Templates

- **Assassin's Creed Brotherhood**: Multi-agent assassination mission coordination
- **Lord of the Rings Fellowship**: Fellowship quest coordination with magical elements
