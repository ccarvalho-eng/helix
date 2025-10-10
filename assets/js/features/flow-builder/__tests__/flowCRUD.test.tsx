/**
 * Comprehensive tests for Flow CRUD operations using GraphQL
 * Tests all phases: Create, Read, Update, Delete
 */

import { MockedProvider } from '@apollo/client/react/testing';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import {
  useCreateFlowMutation,
  useGetFlowQuery,
  useMyFlowsQuery,
  useUpdateFlowMutation,
  useUpdateFlowDataMutation,
  useDeleteFlowMutation,
  useDuplicateFlowMutation,
  CreateFlowDocument,
  GetFlowDocument,
  MyFlowsDocument,
  UpdateFlowDocument,
  UpdateFlowDataDocument,
  DeleteFlowDocument,
  DuplicateFlowDocument,
} from '../../../generated/graphql';

describe('Flow CRUD Operations with GraphQL', () => {
  const mockFlowId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174001';

  const mockFlow = {
    id: mockFlowId,
    title: 'Test Flow',
    description: 'A test flow',
    viewportX: 0,
    viewportY: 0,
    viewportZoom: 1,
    version: 1,
    isTemplate: false,
    templateCategory: null,
    insertedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [],
    edges: [],
  };

  const mockNode = {
    id: '1',
    nodeId: 'node-1',
    type: 'agent',
    positionX: 100,
    positionY: 100,
    width: 140,
    height: 80,
    data: {
      label: 'AI Agent',
      description: 'Test agent',
      config: {},
      color: '#f0f9ff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
    },
    insertedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockEdge = {
    id: '1',
    edgeId: 'edge-1',
    sourceNodeId: 'node-1',
    targetNodeId: 'node-2',
    sourceHandle: null,
    targetHandle: null,
    edgeType: 'default',
    animated: false,
    data: null,
    insertedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('CREATE - Phase 6', () => {
    it('should create a new flow via GraphQL mutation', async () => {
      const mocks = [
        {
          request: {
            query: CreateFlowDocument,
            variables: {
              input: {
                title: 'New Flow',
                viewportX: 0,
                viewportY: 0,
                viewportZoom: 1,
              },
            },
          },
          result: {
            data: {
              createFlow: mockFlow,
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => useCreateFlowMutation(), { wrapper });

      const [createFlow] = result.current;
      const response = await createFlow({
        variables: {
          input: {
            title: 'New Flow',
            viewportX: 0,
            viewportY: 0,
            viewportZoom: 1,
          },
        },
      });

      await waitFor(() => {
        expect(response.data?.createFlow).toEqual(mockFlow);
      });
    });

    it('should handle create flow errors', async () => {
      const mocks = [
        {
          request: {
            query: CreateFlowDocument,
            variables: {
              input: {
                title: 'New Flow',
                viewportX: 0,
                viewportY: 0,
                viewportZoom: 1,
              },
            },
          },
          error: new Error('Failed to create flow'),
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => useCreateFlowMutation(), { wrapper });

      const [createFlow] = result.current;

      await expect(
        createFlow({
          variables: {
            input: {
              title: 'New Flow',
              viewportX: 0,
              viewportY: 0,
              viewportZoom: 1,
            },
          },
        })
      ).rejects.toThrow('Failed to create flow');
    });
  });

  describe('READ - Phase 7', () => {
    it('should fetch a single flow with nodes and edges', async () => {
      const flowWithData = {
        ...mockFlow,
        nodes: [mockNode],
        edges: [mockEdge],
      };

      const mocks = [
        {
          request: {
            query: GetFlowDocument,
            variables: { id: mockFlowId },
          },
          result: {
            data: {
              flow: flowWithData,
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => useGetFlowQuery({ variables: { id: mockFlowId } }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.flow).toEqual(flowWithData);
      expect(result.current.data?.flow?.nodes).toHaveLength(1);
      expect(result.current.data?.flow?.edges).toHaveLength(1);
    });

    it('should fetch all user flows', async () => {
      const mockFlows = [mockFlow, { ...mockFlow, id: 'another-id', title: 'Another Flow' }];

      const mocks = [
        {
          request: {
            query: MyFlowsDocument,
          },
          result: {
            data: {
              myFlows: mockFlows,
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => useMyFlowsQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.myFlows).toEqual(mockFlows);
      expect(result.current.data?.myFlows).toHaveLength(2);
    });

    it('should handle flow not found error', async () => {
      const mocks = [
        {
          request: {
            query: GetFlowDocument,
            variables: { id: 'non-existent-id' },
          },
          result: {
            data: {
              flow: null,
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(
        () => useGetFlowQuery({ variables: { id: 'non-existent-id' } }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.flow).toBeNull();
    });
  });

  describe('UPDATE - Phase 8', () => {
    it('should update flow title and metadata', async () => {
      const updatedFlow = {
        ...mockFlow,
        title: 'Updated Title',
      };

      const mocks = [
        {
          request: {
            query: UpdateFlowDocument,
            variables: {
              id: mockFlowId,
              input: {
                title: 'Updated Title',
              },
            },
          },
          result: {
            data: {
              updateFlow: updatedFlow,
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => useUpdateFlowMutation(), { wrapper });

      const [updateFlow] = result.current;
      const response = await updateFlow({
        variables: {
          id: mockFlowId,
          input: {
            title: 'Updated Title',
          },
        },
      });

      await waitFor(() => {
        expect(response.data?.updateFlow?.title).toBe('Updated Title');
      });
    });

    it('should update flow data with nodes, edges, and viewport', async () => {
      const updatedFlowData = {
        ...mockFlow,
        nodes: [mockNode],
        edges: [mockEdge],
        viewportX: 100,
        viewportY: 200,
        viewportZoom: 1.5,
        version: 2,
      };

      const mocks = [
        {
          request: {
            query: UpdateFlowDataDocument,
            variables: {
              id: mockFlowId,
              input: {
                nodes: [
                  {
                    nodeId: mockNode.nodeId,
                    type: mockNode.type,
                    positionX: mockNode.positionX,
                    positionY: mockNode.positionY,
                    width: mockNode.width,
                    height: mockNode.height,
                    data: mockNode.data,
                  },
                ],
                edges: [
                  {
                    edgeId: mockEdge.edgeId,
                    sourceNodeId: mockEdge.sourceNodeId,
                    targetNodeId: mockEdge.targetNodeId,
                    sourceHandle: mockEdge.sourceHandle,
                    targetHandle: mockEdge.targetHandle,
                    edgeType: mockEdge.edgeType,
                    animated: mockEdge.animated,
                    data: mockEdge.data,
                  },
                ],
                viewportX: 100,
                viewportY: 200,
                viewportZoom: 1.5,
              },
            },
          },
          result: {
            data: {
              updateFlowData: updatedFlowData,
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => useUpdateFlowDataMutation(), { wrapper });

      const [updateFlowData] = result.current;
      const response = await updateFlowData({
        variables: {
          id: mockFlowId,
          input: {
            nodes: [
              {
                nodeId: mockNode.nodeId,
                type: mockNode.type,
                positionX: mockNode.positionX,
                positionY: mockNode.positionY,
                width: mockNode.width,
                height: mockNode.height,
                data: mockNode.data,
              },
            ],
            edges: [
              {
                edgeId: mockEdge.edgeId,
                sourceNodeId: mockEdge.sourceNodeId,
                targetNodeId: mockEdge.targetNodeId,
                sourceHandle: mockEdge.sourceHandle,
                targetHandle: mockEdge.targetHandle,
                edgeType: mockEdge.edgeType,
                animated: mockEdge.animated,
                data: mockEdge.data,
              },
            ],
            viewportX: 100,
            viewportY: 200,
            viewportZoom: 1.5,
          },
        },
      });

      await waitFor(() => {
        expect(response.data?.updateFlowData?.viewportX).toBe(100);
        expect(response.data?.updateFlowData?.viewportY).toBe(200);
        expect(response.data?.updateFlowData?.viewportZoom).toBe(1.5);
        expect(response.data?.updateFlowData?.version).toBe(2);
      });
    });

    it('should handle update errors', async () => {
      const mocks = [
        {
          request: {
            query: UpdateFlowDocument,
            variables: {
              id: mockFlowId,
              input: {
                title: 'Updated Title',
              },
            },
          },
          error: new Error('Failed to update flow'),
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => useUpdateFlowMutation(), { wrapper });

      const [updateFlow] = result.current;

      await expect(
        updateFlow({
          variables: {
            id: mockFlowId,
            input: {
              title: 'Updated Title',
            },
          },
        })
      ).rejects.toThrow('Failed to update flow');
    });
  });

  describe('DELETE - Phase 9', () => {
    it('should delete a flow via GraphQL mutation', async () => {
      const deletedFlow = {
        id: mockFlowId,
        title: 'Test Flow',
        deletedAt: new Date().toISOString(),
      };

      const mocks = [
        {
          request: {
            query: DeleteFlowDocument,
            variables: { id: mockFlowId },
          },
          result: {
            data: {
              deleteFlow: deletedFlow,
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => useDeleteFlowMutation(), { wrapper });

      const [deleteFlow] = result.current;
      const response = await deleteFlow({
        variables: { id: mockFlowId },
      });

      await waitFor(() => {
        expect(response.data?.deleteFlow?.id).toBe(mockFlowId);
        expect(response.data?.deleteFlow?.deletedAt).toBeTruthy();
      });
    });

    it('should handle delete flow errors', async () => {
      const mocks = [
        {
          request: {
            query: DeleteFlowDocument,
            variables: { id: 'non-existent-id' },
          },
          error: new Error('Flow not found'),
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => useDeleteFlowMutation(), { wrapper });

      const [deleteFlow] = result.current;

      await expect(
        deleteFlow({
          variables: { id: 'non-existent-id' },
        })
      ).rejects.toThrow('Flow not found');
    });
  });

  describe('DUPLICATE - Additional Operation', () => {
    it('should duplicate a flow with all nodes and edges', async () => {
      const duplicatedFlow = {
        ...mockFlow,
        id: 'duplicated-flow-id',
        title: 'Test Flow (Copy)',
        nodes: [mockNode],
        edges: [mockEdge],
      };

      const mocks = [
        {
          request: {
            query: DuplicateFlowDocument,
            variables: {
              id: mockFlowId,
            },
          },
          result: {
            data: {
              duplicateFlow: duplicatedFlow,
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => useDuplicateFlowMutation(), { wrapper });

      const [duplicateFlow] = result.current;
      const response = await duplicateFlow({
        variables: { id: mockFlowId },
      });

      await waitFor(() => {
        expect(response.data?.duplicateFlow?.id).not.toBe(mockFlowId);
        expect(response.data?.duplicateFlow?.title).toContain('(Copy)');
        expect(response.data?.duplicateFlow?.nodes).toHaveLength(1);
        expect(response.data?.duplicateFlow?.edges).toHaveLength(1);
      });
    });

    it('should duplicate a flow with custom title', async () => {
      const duplicatedFlow = {
        ...mockFlow,
        id: 'duplicated-flow-id',
        title: 'Custom Title',
      };

      const mocks = [
        {
          request: {
            query: DuplicateFlowDocument,
            variables: {
              id: mockFlowId,
              title: 'Custom Title',
            },
          },
          result: {
            data: {
              duplicateFlow: duplicatedFlow,
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => useDuplicateFlowMutation(), { wrapper });

      const [duplicateFlow] = result.current;
      const response = await duplicateFlow({
        variables: {
          id: mockFlowId,
          title: 'Custom Title',
        },
      });

      await waitFor(() => {
        expect(response.data?.duplicateFlow?.title).toBe('Custom Title');
      });
    });
  });

  describe('Integration - Complete Flow Lifecycle', () => {
    it('should perform complete CRUD lifecycle', async () => {
      const createMock = {
        request: {
          query: CreateFlowDocument,
          variables: {
            input: {
              title: 'Lifecycle Test',
              viewportX: 0,
              viewportY: 0,
              viewportZoom: 1,
            },
          },
        },
        result: {
          data: {
            createFlow: mockFlow,
          },
        },
      };

      const updateMock = {
        request: {
          query: UpdateFlowDocument,
          variables: {
            id: mockFlowId,
            input: {
              title: 'Updated Lifecycle Test',
            },
          },
        },
        result: {
          data: {
            updateFlow: {
              ...mockFlow,
              title: 'Updated Lifecycle Test',
            },
          },
        },
      };

      const deleteMock = {
        request: {
          query: DeleteFlowDocument,
          variables: { id: mockFlowId },
        },
        result: {
          data: {
            deleteFlow: {
              id: mockFlowId,
              title: 'Updated Lifecycle Test',
              deletedAt: new Date().toISOString(),
            },
          },
        },
      };

      const mocks = [createMock, updateMock, deleteMock];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      // Create
      const { result: createResult } = renderHook(() => useCreateFlowMutation(), { wrapper });
      const [createFlow] = createResult.current;
      const createResponse = await createFlow({
        variables: {
          input: {
            title: 'Lifecycle Test',
            viewportX: 0,
            viewportY: 0,
            viewportZoom: 1,
          },
        },
      });
      expect(createResponse.data?.createFlow?.id).toBe(mockFlowId);

      // Update
      const { result: updateResult } = renderHook(() => useUpdateFlowMutation(), { wrapper });
      const [updateFlow] = updateResult.current;
      const updateResponse = await updateFlow({
        variables: {
          id: mockFlowId,
          input: {
            title: 'Updated Lifecycle Test',
          },
        },
      });
      expect(updateResponse.data?.updateFlow?.title).toBe('Updated Lifecycle Test');

      // Delete
      const { result: deleteResult } = renderHook(() => useDeleteFlowMutation(), { wrapper });
      const [deleteFlow] = deleteResult.current;
      const deleteResponse = await deleteFlow({
        variables: { id: mockFlowId },
      });
      expect(deleteResponse.data?.deleteFlow?.id).toBe(mockFlowId);
      expect(deleteResponse.data?.deleteFlow?.deletedAt).toBeTruthy();
    });
  });
});
