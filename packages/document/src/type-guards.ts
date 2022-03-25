import type * as types from './types';

export const isOperationDefinitionNode = createNodeKindTest<types.OperationDefinitionNode>()(
  ['OperationDefinition'],
);
export const isFragmentDefinitionNode = createNodeKindTest<types.FragmentDefinitionNode>()(
  ['FragmentDefinition'],
);
export const isInputTypeDefinitionNode = createNodeKindTest<types.InputTypeDefinitionNode>()(
  [
    'EnumTypeDefinition',
    'InputObjectTypeDefinition',
    'ScalarTypeDefinition',
    'ScalarTypeDefinition',
  ],
);
export const isTypeDefinitionNode = createNodeKindTest<types.TypeDefinitionNode>()(
  [
    'EnumTypeDefinition',
    'InputObjectTypeDefinition',
    'InterfaceTypeDefinition',
    'ObjectTypeDefinition',
    'ScalarTypeDefinition',
    'ScalarTypeDefinition',
    'UnionTypeDefinition',
  ],
);
export const isDirectiveDefinitionNode = createNodeKindTest<types.DirectiveDefinitionNode>()(
  ['DirectiveDefinition'],
);

/**
 * Create a test for a given node kind. This ensures that the list of
 * kinds you pass when constructing the test matches the type you wanted.
 */
function createNodeKindTest<T extends types.ASTNode>() {
  return <U extends readonly T['kind'][]>(
    values: U &
      ([T['kind']] extends [U[number]]
        ? unknown
        : 'Error: You are missing a value from the union'),
  ) => {
    const set = new Set(values);
    return (value: types.ASTNode): value is T => {
      return set.has(value.kind as T['kind']);
    };
  };
}

export const isValidDirectiveLocation = createLiteralTest<
  types.DirectiveLocationNode['value']
>()([
  'QUERY',
  'MUTATION',
  'SUBSCRIPTION',
  'FIELD',
  'FRAGMENT_DEFINITION',
  'FRAGMENT_SPREAD',
  'INLINE_FRAGMENT',
  'VARIABLE_DEFINITION',
  'SCHEMA',
  'SCALAR',
  'OBJECT',
  'FIELD_DEFINITION',
  'ARGUMENT_DEFINITION',
  'INTERFACE',
  'UNION',
  'ENUM',
  'ENUM_VALUE',
  'INPUT_OBJECT',
  'INPUT_FIELD_DEFINITION',
]);
function createLiteralTest<T extends string | number>() {
  return <U extends readonly T[]>(
    values: U &
      ([T] extends [U[number]]
        ? unknown
        : 'Error: You are missing a value from the union'),
  ) => {
    const set = new Set(values);
    return (value: string | number): value is T => {
      return set.has(value as T);
    };
  };
}
export function nodeKind<TKind extends types.ASTNode['kind']>(
  kind: TKind,
): <T extends types.ASTNode>(
  obj: T,
) => obj is Extract<T, {readonly kind: TKind}> {
  return <T extends types.ASTNode>(
    obj: T,
  ): obj is Extract<T, {readonly kind: TKind}> => obj.kind === kind;
}
