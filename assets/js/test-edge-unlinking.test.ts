// Simple test for edge unlinking functionality
describe('Edge Unlinking Logic', () => {
  it('should filter out edges with matching source and target', () => {
    const edges = [
      { id: 'edge-1', source: 'node-1', target: 'node-2', type: 'default' },
      { id: 'edge-2', source: 'node-2', target: 'node-3', type: 'default' },
      { id: 'edge-3', source: 'node-1', target: 'node-2', type: 'default' },
    ];

    // Simulate unlinkEdge functionality
    const unlinkEdge = (sourceId: string, targetId: string) => {
      return edges.filter(edge => !(edge.source === sourceId && edge.target === targetId));
    };

    const result = unlinkEdge('node-1', 'node-2');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('edge-2');
  });

  it('should handle non-existent edge gracefully', () => {
    const edges = [{ id: 'edge-1', source: 'node-1', target: 'node-2', type: 'default' }];

    const unlinkEdge = (sourceId: string, targetId: string) => {
      return edges.filter(edge => !(edge.source === sourceId && edge.target === targetId));
    };

    const result = unlinkEdge('non-existent', 'also-non-existent');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('edge-1');
  });
});
