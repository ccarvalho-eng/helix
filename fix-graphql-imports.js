import { readFileSync, writeFileSync } from 'fs';

const filePath = './assets/js/generated/graphql.ts';
let content = readFileSync(filePath, 'utf8');

// Replace namespace import with direct imports from the React subpath
// This avoids esbuild resolving to @apollo/client/core which doesn't have hooks
content = content.replace(
  /import \* as Apollo from '@apollo\/client';/g,
  `import {
  useQuery,
  useLazyQuery,
  useSuspenseQuery,
  useMutation,
  skipToken
} from '@apollo/client/react';`
);

// Replace all Apollo.X usages with direct function calls
content = content.replaceAll('Apollo.useQuery', 'useQuery');
content = content.replaceAll('Apollo.useLazyQuery', 'useLazyQuery');
content = content.replaceAll('Apollo.useSuspenseQuery', 'useSuspenseQuery');
content = content.replaceAll('Apollo.useMutation', 'useMutation');
content = content.replaceAll('Apollo.skipToken', 'skipToken');

// Replace type references with generic types that strip the generic parameters
content = content.replace(/Apollo\.QueryHookOptions<[^>]+>/g, 'any');
content = content.replace(/Apollo\.LazyQueryHookOptions<[^>]+>/g, 'any');
content = content.replace(/Apollo\.SuspenseQueryHookOptions<[^>]+>/g, 'any');
content = content.replace(/Apollo\.MutationHookOptions<[^>]+>/g, 'any');
content = content.replace(/Apollo\.MutationFunction<[^>]+>/g, 'any');
content = content.replace(/Apollo\.MutationResult<[^>]+>/g, 'any');
content = content.replace(/Apollo\.BaseMutationOptions<[^>]+>/g, 'any');
content = content.replace(/Apollo\.QueryResult<[^>]+>/g, 'any');

// Handle SkipToken specially as it might not have generics
content = content.replaceAll('Apollo.SkipToken', 'any');

// Add @ts-nocheck at the top
content = '// @ts-nocheck\n' + content;

writeFileSync(filePath, content, 'utf8');
console.log('✓ Fixed GraphQL imports');
