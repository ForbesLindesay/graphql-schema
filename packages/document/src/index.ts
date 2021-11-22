import type * as ast from 'graphql/language/ast';
import type * as gt from 'graphql/type';
import GraphQlDocument from './GraphQlDocument';
import GraphQlDocumentBuilder from './GraphQlDocumentBuilder';
import type * as types from './types';

export type {types};
export default GraphQlDocument;

export {throwGraphQlError, printGraphQlLocation} from './errors';

export {
  isOperationDefinitionNode,
  isFragmentDefinitionNode,
  isInputTypeDefinitionNode,
  isTypeDefinitionNode,
  isDirectiveDefinitionNode,
  nodeKind,
} from './type-guards';

export interface DocumentOptions {
  /**
   * The source is used to construct friendlier error messages
   */
  source: types.LocationSource;

  /**
   * If you supply referenced documents, the declarations in
   * those documents will be searched when you look up a
   * declaration by name.
   *
   * If you supply {includeReferencedDocuments: true} when listing
   * declarations, the declarations in referenced documents are
   * also included in lists. By default, only local declarations
   * are included when listing declarations.
   */
  referencedDocuments?: readonly GraphQlDocument[];
}

export function fromDocumentNode(
  node: ast.DocumentNode,
  options: DocumentOptions,
): GraphQlDocument {
  const builder = new GraphQlDocumentBuilder(options.source);
  return builder.fromDocumentNode(node, options.referencedDocuments ?? []);
}

export function fromSchema(
  schema: gt.GraphQLSchema,
  options: DocumentOptions,
): GraphQlDocument {
  const builder = new GraphQlDocumentBuilder(options.source);
  return builder.fromGraphQlSchema(schema, options.referencedDocuments ?? []);
}
