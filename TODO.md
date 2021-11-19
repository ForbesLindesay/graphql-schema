1. Create "get-typescript-client-types" package
   1. takes as config:
      1. Name of package & export to use as the "create method" function
         1. Can optionally have separate implementations for mutation, query, mutation without args, query without args
         1. Could optionally allow defining inline code in place of a module to import
      1. List of type parameters for the package:
         1. TArgs - the expected arguments
         1. TResult - the return type from the server (assuming success)
         1. TExtractedResult - the return type from the server ignoring the Query/Mutation name
         1. TOperationName - the operation name
         1. TCamelCasedOperationName - the operation name in camel case
      1. Set of args the package expects
         1. QueryString(minify=false, inlineFragments=false, includeFragments=false) - the query as a string, optionally with fragments inlined and the query minified
         1. QueryDocument(inlineFragments=false, includeFragments=false) - the parsed GraphQL Query
         1. FragmentsString(minify=false) - any fragments used by the query
         1. FragmentNames - an array of fragments used by the query
         1. FragmentDocuments - the parsed GraphQL fragments used in the query
      1. Should export named types?
      1. Should generate named types?
      1. Can support explicit type aliases via annotations in the query?
1. Set up a better process for watching a single file in the CLI (given that config is often in the root directory of a massive project)
1. Edit the CLI so the commands are:
   1. help
   1. validate
   1. generate - reads & validates a schema then produces various outputs based on a config
      1. resolvers:
         1. validate-schema - to get parsed schema
         1. build-typescript-declarations - print types for all required declarations
         1. get-typescript-resolver-types - print types for the resolvers
      1. client
         1. validate-schema - to get parsed schema
         1. build-typescript-declarations - print types for all required declarations (ignoring top level objects)
         1. get-typescript-client - print api for the client
      1. schema-string
      1. schema-object
   1. debug - open GraphIQL client with config specified
