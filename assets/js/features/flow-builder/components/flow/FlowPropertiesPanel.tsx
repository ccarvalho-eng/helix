import { Node, Edge } from 'reactflow';
import { PropertiesPanel } from '../properties';
import { AIFlowNode } from '../../types';

interface FlowPropertiesPanelProps {
  selectedNode: AIFlowNode | null;
  nodes: Node[];
  edges: Edge[];
  onUpdateNode: (_id: string, _updates: Partial<AIFlowNode>) => void;
  onDeleteNode: (_id: string) => void;
  onOpenNodeModal?: (_nodeId: string) => void;
  onUnlinkEdge?: (_sourceId: string, _targetId: string) => void;
}

export function FlowPropertiesPanel({
  selectedNode,
  nodes,
  edges,
  onUpdateNode,
  onDeleteNode,
  onOpenNodeModal,
  onUnlinkEdge,
}: FlowPropertiesPanelProps) {
  return (
    <div className='flow-properties-panel'>
      <PropertiesPanel
        selectedNode={selectedNode}
        selectedConnection={null}
        onUpdateNode={onUpdateNode}
        onUpdateConnection={() => {}}
        onDeleteNode={onDeleteNode}
        allNodes={nodes.map(n => n.data)}
        allEdges={edges.map(e => ({
          source: e.source,
          target: e.target,
        }))}
        onOpenNodeModal={onOpenNodeModal}
        onUnlinkEdge={onUnlinkEdge}
      />
    </div>
  );
}
