import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  DateTime: { input: any; output: any };
  Json: { input: any; output: any };
};

/** Authentication payload containing user and token */
export type AuthPayload = {
  __typename?: 'AuthPayload';
  /** JWT token for authentication */
  token?: Maybe<Scalars['String']['output']>;
  /** The authenticated user */
  user?: Maybe<User>;
};

/** Input for changing password */
export type ChangePasswordInput = {
  /** New password (minimum 8 characters) */
  password: Scalars['String']['input'];
};

/** Input for creating a new flow */
export type CreateFlowInput = {
  /** Flow description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Flow title */
  title: Scalars['String']['input'];
  /** Viewport X offset (default: 0.0) */
  viewportX?: InputMaybe<Scalars['Float']['input']>;
  /** Viewport Y offset (default: 0.0) */
  viewportY?: InputMaybe<Scalars['Float']['input']>;
  /** Viewport zoom level (default: 1.0) */
  viewportZoom?: InputMaybe<Scalars['Float']['input']>;
};

/** Input for a flow edge */
export type EdgeInput = {
  /** Whether edge is animated */
  animated?: InputMaybe<Scalars['Boolean']['input']>;
  /** Edge configuration data */
  data?: InputMaybe<Scalars['Json']['input']>;
  /** Client-side edge identifier */
  edgeId: Scalars['String']['input'];
  /** Edge type */
  edgeType?: InputMaybe<Scalars['String']['input']>;
  /** Source connection handle */
  sourceHandle?: InputMaybe<Scalars['String']['input']>;
  /** Source node identifier */
  sourceNodeId: Scalars['String']['input'];
  /** Target connection handle */
  targetHandle?: InputMaybe<Scalars['String']['input']>;
  /** Target node identifier */
  targetNodeId: Scalars['String']['input'];
};

/** A flow diagram with nodes and edges */
export type Flow = {
  __typename?: 'Flow';
  /** The flow's description */
  description?: Maybe<Scalars['String']['output']>;
  /** Edges in this flow */
  edges?: Maybe<Array<Maybe<FlowEdge>>>;
  /** The unique identifier for the flow */
  id?: Maybe<Scalars['ID']['output']>;
  /** When the flow was created */
  insertedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Whether this flow is a template */
  isTemplate?: Maybe<Scalars['Boolean']['output']>;
  /** Nodes in this flow */
  nodes?: Maybe<Array<Maybe<FlowNode>>>;
  /** Category for template flows */
  templateCategory?: Maybe<Scalars['String']['output']>;
  /** The flow's title */
  title?: Maybe<Scalars['String']['output']>;
  /** When the flow was last updated */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The owner of the flow */
  userId?: Maybe<Scalars['ID']['output']>;
  /** Version number for optimistic locking */
  version?: Maybe<Scalars['Int']['output']>;
  /** Viewport X offset */
  viewportX?: Maybe<Scalars['Float']['output']>;
  /** Viewport Y offset */
  viewportY?: Maybe<Scalars['Float']['output']>;
  /** Viewport zoom level */
  viewportZoom?: Maybe<Scalars['Float']['output']>;
};

/** An edge (connection) between nodes in a flow diagram */
export type FlowEdge = {
  __typename?: 'FlowEdge';
  /** Whether the edge is animated */
  animated?: Maybe<Scalars['Boolean']['output']>;
  /** Arbitrary JSON data for edge configuration */
  data?: Maybe<Scalars['Json']['output']>;
  /** The client-side edge identifier */
  edgeId?: Maybe<Scalars['String']['output']>;
  /** The type of edge connection */
  edgeType?: Maybe<Scalars['String']['output']>;
  /** The unique identifier for the edge */
  id?: Maybe<Scalars['ID']['output']>;
  /** When the edge was created */
  insertedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The source connection handle */
  sourceHandle?: Maybe<Scalars['String']['output']>;
  /** The source node identifier */
  sourceNodeId?: Maybe<Scalars['String']['output']>;
  /** The target connection handle */
  targetHandle?: Maybe<Scalars['String']['output']>;
  /** The target node identifier */
  targetNodeId?: Maybe<Scalars['String']['output']>;
  /** When the edge was last updated */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

/** A node (block) within a flow diagram */
export type FlowNode = {
  __typename?: 'FlowNode';
  /** Arbitrary JSON data for node configuration */
  data?: Maybe<Scalars['Json']['output']>;
  /** Height of the node */
  height?: Maybe<Scalars['Float']['output']>;
  /** The unique identifier for the node */
  id?: Maybe<Scalars['ID']['output']>;
  /** When the node was created */
  insertedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The client-side node identifier */
  nodeId?: Maybe<Scalars['String']['output']>;
  /** X coordinate position */
  positionX?: Maybe<Scalars['Float']['output']>;
  /** Y coordinate position */
  positionY?: Maybe<Scalars['Float']['output']>;
  /** The type of node (e.g., agent, tool, model) */
  type?: Maybe<Scalars['String']['output']>;
  /** When the node was last updated */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Width of the node */
  width?: Maybe<Scalars['Float']['output']>;
};

/** Input for user login */
export type LoginInput = {
  /** Email address */
  email: Scalars['String']['input'];
  /** Password */
  password: Scalars['String']['input'];
};

/** Input for a flow node */
export type NodeInput = {
  /** Node configuration data */
  data?: InputMaybe<Scalars['Json']['input']>;
  /** Node height */
  height?: InputMaybe<Scalars['Float']['input']>;
  /** Client-side node identifier */
  nodeId: Scalars['String']['input'];
  /** X coordinate */
  positionX: Scalars['Float']['input'];
  /** Y coordinate */
  positionY: Scalars['Float']['input'];
  /** Node type */
  type: Scalars['String']['input'];
  /** Node width */
  width?: InputMaybe<Scalars['Float']['input']>;
};

/** Input for user registration */
export type RegisterInput = {
  /** Email address */
  email: Scalars['String']['input'];
  /** First name */
  firstName: Scalars['String']['input'];
  /** Last name */
  lastName: Scalars['String']['input'];
  /** Password (minimum 8 characters) */
  password: Scalars['String']['input'];
};

export type RootMutationType = {
  __typename?: 'RootMutationType';
  /** Change user password */
  changePassword?: Maybe<User>;
  /** Create a new flow */
  createFlow?: Maybe<Flow>;
  /** Delete a flow (soft delete) */
  deleteFlow?: Maybe<Flow>;
  /** Duplicate a flow */
  duplicateFlow?: Maybe<Flow>;
  /** Login with email and password */
  login?: Maybe<AuthPayload>;
  /** Register a new user */
  register?: Maybe<AuthPayload>;
  /** Update flow metadata (title, description, viewport) */
  updateFlow?: Maybe<Flow>;
  /** Update flow data (nodes and edges) with optimistic locking */
  updateFlowData?: Maybe<Flow>;
  /** Update user profile */
  updateProfile?: Maybe<User>;
};

export type RootMutationTypeChangePasswordArgs = {
  input: ChangePasswordInput;
};

export type RootMutationTypeCreateFlowArgs = {
  input: CreateFlowInput;
};

export type RootMutationTypeDeleteFlowArgs = {
  id: Scalars['ID']['input'];
};

export type RootMutationTypeDuplicateFlowArgs = {
  id: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};

export type RootMutationTypeLoginArgs = {
  input: LoginInput;
};

export type RootMutationTypeRegisterArgs = {
  input: RegisterInput;
};

export type RootMutationTypeUpdateFlowArgs = {
  id: Scalars['ID']['input'];
  input: UpdateFlowInput;
};

export type RootMutationTypeUpdateFlowDataArgs = {
  id: Scalars['ID']['input'];
  input: UpdateFlowDataInput;
};

export type RootMutationTypeUpdateProfileArgs = {
  input: UpdateUserInput;
};

export type RootQueryType = {
  __typename?: 'RootQueryType';
  /** Get a specific flow by ID */
  flow?: Maybe<Flow>;
  /** Get the current authenticated user */
  me?: Maybe<User>;
  /** Get all flows for the current user */
  myFlows?: Maybe<Array<Maybe<Flow>>>;
  /** Get a user by ID (admin only) */
  user?: Maybe<User>;
  /** List all users (admin only) */
  users?: Maybe<Array<Maybe<User>>>;
};

export type RootQueryTypeFlowArgs = {
  id: Scalars['ID']['input'];
};

export type RootQueryTypeUserArgs = {
  id: Scalars['ID']['input'];
};

/** Input for updating flow data (nodes and edges) */
export type UpdateFlowDataInput = {
  /** List of edges */
  edges: Array<EdgeInput>;
  /** List of nodes */
  nodes: Array<NodeInput>;
  /** Expected version for optimistic locking */
  version: Scalars['Int']['input'];
};

/** Input for updating flow metadata */
export type UpdateFlowInput = {
  /** Flow description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Flow title */
  title?: InputMaybe<Scalars['String']['input']>;
  /** Viewport X offset */
  viewportX?: InputMaybe<Scalars['Float']['input']>;
  /** Viewport Y offset */
  viewportY?: InputMaybe<Scalars['Float']['input']>;
  /** Viewport zoom level */
  viewportZoom?: InputMaybe<Scalars['Float']['input']>;
};

/** Input for updating user profile */
export type UpdateUserInput = {
  /** Email address */
  email?: InputMaybe<Scalars['String']['input']>;
  /** First name */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** Last name */
  lastName?: InputMaybe<Scalars['String']['input']>;
};

/** A user of the application */
export type User = {
  __typename?: 'User';
  /** The user's email address */
  email?: Maybe<Scalars['String']['output']>;
  /** The user's first name */
  firstName?: Maybe<Scalars['String']['output']>;
  /** The unique identifier for the user */
  id?: Maybe<Scalars['ID']['output']>;
  /** When the user was created */
  insertedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The user's last name */
  lastName?: Maybe<Scalars['String']['output']>;
  /** When the user was last updated */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;

export type LoginMutation = {
  __typename?: 'RootMutationType';
  login?: {
    __typename?: 'AuthPayload';
    token?: string | null;
    user?: {
      __typename?: 'User';
      id?: string | null;
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  } | null;
};

export type RegisterMutationVariables = Exact<{
  input: RegisterInput;
}>;

export type RegisterMutation = {
  __typename?: 'RootMutationType';
  register?: {
    __typename?: 'AuthPayload';
    token?: string | null;
    user?: {
      __typename?: 'User';
      id?: string | null;
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  } | null;
};

export type MeQueryVariables = Exact<{ [key: string]: never }>;

export type MeQuery = {
  __typename?: 'RootQueryType';
  me?: {
    __typename?: 'User';
    id?: string | null;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
};

export type MyFlowsQueryVariables = Exact<{ [key: string]: never }>;

export type MyFlowsQuery = {
  __typename?: 'RootQueryType';
  myFlows?: Array<{
    __typename?: 'Flow';
    id?: string | null;
    title?: string | null;
    description?: string | null;
    viewportX?: number | null;
    viewportY?: number | null;
    viewportZoom?: number | null;
    version?: number | null;
    isTemplate?: boolean | null;
    templateCategory?: string | null;
    insertedAt?: any | null;
    updatedAt?: any | null;
  } | null> | null;
};

export type GetFlowQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type GetFlowQuery = {
  __typename?: 'RootQueryType';
  flow?: {
    __typename?: 'Flow';
    id?: string | null;
    title?: string | null;
    description?: string | null;
    viewportX?: number | null;
    viewportY?: number | null;
    viewportZoom?: number | null;
    version?: number | null;
    isTemplate?: boolean | null;
    templateCategory?: string | null;
    insertedAt?: any | null;
    updatedAt?: any | null;
    nodes?: Array<{
      __typename?: 'FlowNode';
      id?: string | null;
      nodeId?: string | null;
      type?: string | null;
      positionX?: number | null;
      positionY?: number | null;
      width?: number | null;
      height?: number | null;
      data?: any | null;
      insertedAt?: any | null;
      updatedAt?: any | null;
    } | null> | null;
    edges?: Array<{
      __typename?: 'FlowEdge';
      id?: string | null;
      edgeId?: string | null;
      sourceNodeId?: string | null;
      targetNodeId?: string | null;
      sourceHandle?: string | null;
      targetHandle?: string | null;
      edgeType?: string | null;
      animated?: boolean | null;
      data?: any | null;
      insertedAt?: any | null;
      updatedAt?: any | null;
    } | null> | null;
  } | null;
};

export type CreateFlowMutationVariables = Exact<{
  input: CreateFlowInput;
}>;

export type CreateFlowMutation = {
  __typename?: 'RootMutationType';
  createFlow?: {
    __typename?: 'Flow';
    id?: string | null;
    title?: string | null;
    description?: string | null;
    viewportX?: number | null;
    viewportY?: number | null;
    viewportZoom?: number | null;
    version?: number | null;
    isTemplate?: boolean | null;
    templateCategory?: string | null;
    insertedAt?: any | null;
    updatedAt?: any | null;
  } | null;
};

export type UpdateFlowMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateFlowInput;
}>;

export type UpdateFlowMutation = {
  __typename?: 'RootMutationType';
  updateFlow?: {
    __typename?: 'Flow';
    id?: string | null;
    title?: string | null;
    description?: string | null;
    viewportX?: number | null;
    viewportY?: number | null;
    viewportZoom?: number | null;
    version?: number | null;
    insertedAt?: any | null;
    updatedAt?: any | null;
  } | null;
};

export type UpdateFlowDataMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateFlowDataInput;
}>;

export type UpdateFlowDataMutation = {
  __typename?: 'RootMutationType';
  updateFlowData?: {
    __typename?: 'Flow';
    id?: string | null;
    version?: number | null;
    updatedAt?: any | null;
    nodes?: Array<{
      __typename?: 'FlowNode';
      id?: string | null;
      nodeId?: string | null;
      type?: string | null;
      positionX?: number | null;
      positionY?: number | null;
      width?: number | null;
      height?: number | null;
      data?: any | null;
    } | null> | null;
    edges?: Array<{
      __typename?: 'FlowEdge';
      id?: string | null;
      edgeId?: string | null;
      sourceNodeId?: string | null;
      targetNodeId?: string | null;
      sourceHandle?: string | null;
      targetHandle?: string | null;
      edgeType?: string | null;
      animated?: boolean | null;
      data?: any | null;
    } | null> | null;
  } | null;
};

export type DeleteFlowMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type DeleteFlowMutation = {
  __typename?: 'RootMutationType';
  deleteFlow?: {
    __typename?: 'Flow';
    id?: string | null;
    title?: string | null;
    deletedAt?: any | null;
  } | null;
};

export type DuplicateFlowMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
}>;

export type DuplicateFlowMutation = {
  __typename?: 'RootMutationType';
  duplicateFlow?: {
    __typename?: 'Flow';
    id?: string | null;
    title?: string | null;
    description?: string | null;
    viewportX?: number | null;
    viewportY?: number | null;
    viewportZoom?: number | null;
    version?: number | null;
    insertedAt?: any | null;
    updatedAt?: any | null;
    nodes?: Array<{
      __typename?: 'FlowNode';
      id?: string | null;
      nodeId?: string | null;
      type?: string | null;
      positionX?: number | null;
      positionY?: number | null;
      width?: number | null;
      height?: number | null;
      data?: any | null;
    } | null> | null;
    edges?: Array<{
      __typename?: 'FlowEdge';
      id?: string | null;
      edgeId?: string | null;
      sourceNodeId?: string | null;
      targetNodeId?: string | null;
      sourceHandle?: string | null;
      targetHandle?: string | null;
      edgeType?: string | null;
      animated?: boolean | null;
      data?: any | null;
    } | null> | null;
  } | null;
};

export const LoginDocument = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        email
        firstName
        lastName
      }
      token
    }
  }
`;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useLoginMutation(
  baseOptions?: Apollo.MutationHookOptions<LoginMutation, LoginMutationVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
}
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<
  LoginMutation,
  LoginMutationVariables
>;
export const RegisterDocument = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        email
        firstName
        lastName
      }
      token
    }
  }
`;
export type RegisterMutationFn = Apollo.MutationFunction<
  RegisterMutation,
  RegisterMutationVariables
>;

/**
 * __useRegisterMutation__
 *
 * To run a mutation, you first call `useRegisterMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerMutation, { data, loading, error }] = useRegisterMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRegisterMutation(
  baseOptions?: Apollo.MutationHookOptions<RegisterMutation, RegisterMutationVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<RegisterMutation, RegisterMutationVariables>(RegisterDocument, options);
}
export type RegisterMutationHookResult = ReturnType<typeof useRegisterMutation>;
export type RegisterMutationResult = Apollo.MutationResult<RegisterMutation>;
export type RegisterMutationOptions = Apollo.BaseMutationOptions<
  RegisterMutation,
  RegisterMutationVariables
>;
export const MeDocument = gql`
  query Me {
    me {
      id
      email
      firstName
      lastName
    }
  }
`;

/**
 * __useMeQuery__
 *
 * To run a query within a React component, call `useMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useMeQuery(baseOptions?: Apollo.QueryHookOptions<MeQuery, MeQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<MeQuery, MeQueryVariables>(MeDocument, options);
}
export function useMeLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<MeQuery, MeQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<MeQuery, MeQueryVariables>(MeDocument, options);
}
export function useMeSuspenseQuery(
  baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>
) {
  const options =
    baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<MeQuery, MeQueryVariables>(MeDocument, options);
}
export type MeQueryHookResult = ReturnType<typeof useMeQuery>;
export type MeLazyQueryHookResult = ReturnType<typeof useMeLazyQuery>;
export type MeSuspenseQueryHookResult = ReturnType<typeof useMeSuspenseQuery>;
export type MeQueryResult = Apollo.QueryResult<MeQuery, MeQueryVariables>;
export const MyFlowsDocument = gql`
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
`;

/**
 * __useMyFlowsQuery__
 *
 * To run a query within a React component, call `useMyFlowsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyFlowsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyFlowsQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyFlowsQuery(
  baseOptions?: Apollo.QueryHookOptions<MyFlowsQuery, MyFlowsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<MyFlowsQuery, MyFlowsQueryVariables>(MyFlowsDocument, options);
}
export function useMyFlowsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<MyFlowsQuery, MyFlowsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<MyFlowsQuery, MyFlowsQueryVariables>(MyFlowsDocument, options);
}
export function useMyFlowsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<MyFlowsQuery, MyFlowsQueryVariables>
) {
  const options =
    baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<MyFlowsQuery, MyFlowsQueryVariables>(MyFlowsDocument, options);
}
export type MyFlowsQueryHookResult = ReturnType<typeof useMyFlowsQuery>;
export type MyFlowsLazyQueryHookResult = ReturnType<typeof useMyFlowsLazyQuery>;
export type MyFlowsSuspenseQueryHookResult = ReturnType<typeof useMyFlowsSuspenseQuery>;
export type MyFlowsQueryResult = Apollo.QueryResult<MyFlowsQuery, MyFlowsQueryVariables>;
export const GetFlowDocument = gql`
  query GetFlow($id: ID!) {
    flow(id: $id) {
      id
      title
      description
      viewportX
      viewportY
      viewportZoom
      version
      isTemplate
      templateCategory
      nodes {
        id
        nodeId
        type
        positionX
        positionY
        width
        height
        data
        insertedAt
        updatedAt
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
        insertedAt
        updatedAt
      }
      insertedAt
      updatedAt
    }
  }
`;

/**
 * __useGetFlowQuery__
 *
 * To run a query within a React component, call `useGetFlowQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFlowQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFlowQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetFlowQuery(
  baseOptions: Apollo.QueryHookOptions<GetFlowQuery, GetFlowQueryVariables> &
    ({ variables: GetFlowQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetFlowQuery, GetFlowQueryVariables>(GetFlowDocument, options);
}
export function useGetFlowLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<GetFlowQuery, GetFlowQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetFlowQuery, GetFlowQueryVariables>(GetFlowDocument, options);
}
export function useGetFlowSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<GetFlowQuery, GetFlowQueryVariables>
) {
  const options =
    baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetFlowQuery, GetFlowQueryVariables>(GetFlowDocument, options);
}
export type GetFlowQueryHookResult = ReturnType<typeof useGetFlowQuery>;
export type GetFlowLazyQueryHookResult = ReturnType<typeof useGetFlowLazyQuery>;
export type GetFlowSuspenseQueryHookResult = ReturnType<typeof useGetFlowSuspenseQuery>;
export type GetFlowQueryResult = Apollo.QueryResult<GetFlowQuery, GetFlowQueryVariables>;
export const CreateFlowDocument = gql`
  mutation CreateFlow($input: CreateFlowInput!) {
    createFlow(input: $input) {
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
`;
export type CreateFlowMutationFn = Apollo.MutationFunction<
  CreateFlowMutation,
  CreateFlowMutationVariables
>;

/**
 * __useCreateFlowMutation__
 *
 * To run a mutation, you first call `useCreateFlowMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateFlowMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createFlowMutation, { data, loading, error }] = useCreateFlowMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateFlowMutation(
  baseOptions?: Apollo.MutationHookOptions<CreateFlowMutation, CreateFlowMutationVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<CreateFlowMutation, CreateFlowMutationVariables>(
    CreateFlowDocument,
    options
  );
}
export type CreateFlowMutationHookResult = ReturnType<typeof useCreateFlowMutation>;
export type CreateFlowMutationResult = Apollo.MutationResult<CreateFlowMutation>;
export type CreateFlowMutationOptions = Apollo.BaseMutationOptions<
  CreateFlowMutation,
  CreateFlowMutationVariables
>;
export const UpdateFlowDocument = gql`
  mutation UpdateFlow($id: ID!, $input: UpdateFlowInput!) {
    updateFlow(id: $id, input: $input) {
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
`;
export type UpdateFlowMutationFn = Apollo.MutationFunction<
  UpdateFlowMutation,
  UpdateFlowMutationVariables
>;

/**
 * __useUpdateFlowMutation__
 *
 * To run a mutation, you first call `useUpdateFlowMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateFlowMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateFlowMutation, { data, loading, error }] = useUpdateFlowMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateFlowMutation(
  baseOptions?: Apollo.MutationHookOptions<UpdateFlowMutation, UpdateFlowMutationVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<UpdateFlowMutation, UpdateFlowMutationVariables>(
    UpdateFlowDocument,
    options
  );
}
export type UpdateFlowMutationHookResult = ReturnType<typeof useUpdateFlowMutation>;
export type UpdateFlowMutationResult = Apollo.MutationResult<UpdateFlowMutation>;
export type UpdateFlowMutationOptions = Apollo.BaseMutationOptions<
  UpdateFlowMutation,
  UpdateFlowMutationVariables
>;
export const UpdateFlowDataDocument = gql`
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
`;
export type UpdateFlowDataMutationFn = Apollo.MutationFunction<
  UpdateFlowDataMutation,
  UpdateFlowDataMutationVariables
>;

/**
 * __useUpdateFlowDataMutation__
 *
 * To run a mutation, you first call `useUpdateFlowDataMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateFlowDataMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateFlowDataMutation, { data, loading, error }] = useUpdateFlowDataMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateFlowDataMutation(
  baseOptions?: Apollo.MutationHookOptions<UpdateFlowDataMutation, UpdateFlowDataMutationVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<UpdateFlowDataMutation, UpdateFlowDataMutationVariables>(
    UpdateFlowDataDocument,
    options
  );
}
export type UpdateFlowDataMutationHookResult = ReturnType<typeof useUpdateFlowDataMutation>;
export type UpdateFlowDataMutationResult = Apollo.MutationResult<UpdateFlowDataMutation>;
export type UpdateFlowDataMutationOptions = Apollo.BaseMutationOptions<
  UpdateFlowDataMutation,
  UpdateFlowDataMutationVariables
>;
export const DeleteFlowDocument = gql`
  mutation DeleteFlow($id: ID!) {
    deleteFlow(id: $id) {
      id
      title
      deletedAt: updatedAt
    }
  }
`;
export type DeleteFlowMutationFn = Apollo.MutationFunction<
  DeleteFlowMutation,
  DeleteFlowMutationVariables
>;

/**
 * __useDeleteFlowMutation__
 *
 * To run a mutation, you first call `useDeleteFlowMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteFlowMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteFlowMutation, { data, loading, error }] = useDeleteFlowMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteFlowMutation(
  baseOptions?: Apollo.MutationHookOptions<DeleteFlowMutation, DeleteFlowMutationVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<DeleteFlowMutation, DeleteFlowMutationVariables>(
    DeleteFlowDocument,
    options
  );
}
export type DeleteFlowMutationHookResult = ReturnType<typeof useDeleteFlowMutation>;
export type DeleteFlowMutationResult = Apollo.MutationResult<DeleteFlowMutation>;
export type DeleteFlowMutationOptions = Apollo.BaseMutationOptions<
  DeleteFlowMutation,
  DeleteFlowMutationVariables
>;
export const DuplicateFlowDocument = gql`
  mutation DuplicateFlow($id: ID!, $title: String) {
    duplicateFlow(id: $id, title: $title) {
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
`;
export type DuplicateFlowMutationFn = Apollo.MutationFunction<
  DuplicateFlowMutation,
  DuplicateFlowMutationVariables
>;

/**
 * __useDuplicateFlowMutation__
 *
 * To run a mutation, you first call `useDuplicateFlowMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDuplicateFlowMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [duplicateFlowMutation, { data, loading, error }] = useDuplicateFlowMutation({
 *   variables: {
 *      id: // value for 'id'
 *      title: // value for 'title'
 *   },
 * });
 */
export function useDuplicateFlowMutation(
  baseOptions?: Apollo.MutationHookOptions<DuplicateFlowMutation, DuplicateFlowMutationVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<DuplicateFlowMutation, DuplicateFlowMutationVariables>(
    DuplicateFlowDocument,
    options
  );
}
export type DuplicateFlowMutationHookResult = ReturnType<typeof useDuplicateFlowMutation>;
export type DuplicateFlowMutationResult = Apollo.MutationResult<DuplicateFlowMutation>;
export type DuplicateFlowMutationOptions = Apollo.BaseMutationOptions<
  DuplicateFlowMutation,
  DuplicateFlowMutationVariables
>;
