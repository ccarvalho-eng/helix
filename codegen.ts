import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:4000/api/graphql',
  documents: ['assets/js/**/*.{ts,tsx,graphql,gql}'],
  generates: {
    './assets/js/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo'
      ],
      config: {
        withHooks: true,
        withComponent: false,
        withHOC: false
      }
    }
  },
  ignoreNoDocuments: true
};

export default config;