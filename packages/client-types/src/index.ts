import GraphQlDocument, {errors, types} from '@graphql-schema/document';
import assertNever from 'assert-never';
import * as clientTypes from './types';

export {clientTypes};

const typesEqualityCheckers: {
  [TKey in clientTypes.TypeNode<{
    readonly kind: 'ClientObjectType';
  }>['kind']]: (
    a: Extract<
      clientTypes.TypeNode<{readonly kind: 'ClientObjectType'}>,
      {readonly kind: TKey}
    >,
    b: Extract<
      clientTypes.TypeNode<{readonly kind: 'ClientObjectType'}>,
      {readonly kind: TKey}
    >,
  ) => boolean;
} = {
  BooleanType: () => true,
  FloatType: () => true,
  IdType: () => true,
  IntType: () => true,
  StringType: () => true,

  ClientTypeNameType: (a, b) => a.name.value === b.name.value,
  ScalarTypeDefinition: (a, b) => a.name.value === b.name.value,
  EnumTypeDefinition: (a, b) => a.name.value === b.name.value,
  ClientListType: (a, b) => typesEqual(a.ofType, b.ofType),
  ClientObjectType: () => false,
  ClientNullType: (a, b) => typesEqual(a.ofType, b.ofType),
  ClientUnionType: () => false,
};

function typesEqual(
  a: clientTypes.TypeNode<{readonly kind: 'ClientObjectType'}>,
  b: clientTypes.TypeNode<{readonly kind: 'ClientObjectType'}>,
): boolean {
  return a.kind === b.kind && typesEqualityCheckers[a.kind](a as any, b as any);
}

function unionOfTypes<
  TObject extends {readonly kind: 'ClientObjectType'},
  T extends clientTypes.TypeExceptNullableAndUnion<TObject>
>(
  types: readonly (
    | T
    | clientTypes.UnionTypeNode<TObject, T>
    | clientTypes.NullTypeNode<
        TObject,
        T | clientTypes.UnionTypeNode<TObject, T>
      >
  )[],
):
  | T
  | clientTypes.UnionTypeNode<TObject, T>
  | clientTypes.NullTypeNode<
      TObject,
      T | clientTypes.UnionTypeNode<TObject, T>
    > {
  if (types.length === 1) return types[0];

  const resultTypes: T[] = [];
  for (const t of types
    .map((t) => (t.kind === 'ClientNullType' ? t.ofType : t))
    .flatMap((t) => (t.kind === 'ClientUnionType' ? t.types : [t]))) {
    if (!resultTypes.some((rt) => typesEqual(t, rt))) {
      resultTypes.push(t);
    }
  }
  const nonNullResult: T | clientTypes.UnionTypeNode<TObject, T> =
    resultTypes.length === 1
      ? resultTypes[0]
      : {kind: 'ClientUnionType', types: resultTypes};

  return types.some((t) => t.kind === 'ClientNullType')
    ? {kind: 'ClientNullType', ofType: nonNullResult}
    : nonNullResult;
}

function nullableOfType<
  TObject extends {readonly kind: 'ClientObjectType'},
  T extends clientTypes.TypeExceptNullableNode<TObject>
>(
  type: T | clientTypes.NullTypeNode<TObject, T>,
): clientTypes.NullTypeNode<TObject, T> {
  if (type.kind === 'ClientNullType') {
    return type;
  } else {
    return {kind: 'ClientNullType', ofType: type};
  }
}

function getObjectTypes(
  type:
    | types.ObjectTypeDefinitionNode
    | types.InterfaceTypeDefinitionNode
    | types.UnionTypeDefinitionNode,
  {document}: {document: GraphQlDocument},
): readonly types.ObjectTypeDefinitionNode[] {
  if (type.kind === 'InterfaceTypeDefinition') {
    return document.getInterfaceImplementations(type);
  }
  if (type.kind === 'UnionTypeDefinition') {
    return type.types.flatMap((t) =>
      getObjectTypes(
        document.getInterfaceTypeDefinition(t) ??
          document.getUnionTypeDefinition(t) ??
          document.getObjectTypeDefinitionX(t),
        {document},
      ),
    );
  }
  return [type];
}

function getReferencedTypeNames(
  selectionSet: types.SelectionSetNode,
  {document}: {document: GraphQlDocument},
): readonly types.NameNode[] {
  const addedNames = new Set<string>();
  const result: types.NameNode[] = [];
  for (const selection of selectionSet.selections) {
    switch (selection.kind) {
      case 'FragmentSpread': {
        const fragment = document.getFragmentX(selection.name);
        const type = fragment.typeCondition;
        if (!addedNames.has(type.value)) {
          addedNames.add(type.value);
          result.push(type);
        }
        break;
      }
      case 'InlineFragment': {
        const type = selection.typeCondition;
        if (type && !addedNames.has(type.value)) {
          addedNames.add(type.value);
          result.push(type);
        }
        const subTypes = getReferencedTypeNames(selection.selectionSet, {
          document,
        });
        for (const type of subTypes) {
          if (!addedNames.has(type.value)) {
            addedNames.add(type.value);
            result.push(type);
          }
        }
        break;
      }
      case 'Field':
        break;
      default:
        assertNever(selection);
    }
  }
  return result;
}

function groupObjectTypes(
  type:
    | types.ObjectTypeDefinitionNode
    | types.InterfaceTypeDefinitionNode
    | types.UnionTypeDefinitionNode,
  selectionSet: types.SelectionSetNode,
  {document}: {document: GraphQlDocument},
) {
  const types = getObjectTypes(type, {document});
  const referencedTypes = getReferencedTypeNames(selectionSet, {document});
  const referencedTypeNames = new Set(referencedTypes.map((t) => t.value));

  const referencedObjectTypes: types.ObjectTypeDefinitionNode[] = [];
  const otherObjectTypes: types.ObjectTypeDefinitionNode[] = [];
  for (const type of types) {
    if (referencedTypeNames.has(type.name.value)) {
      referencedObjectTypes.push(type);
    } else {
      otherObjectTypes.push(type);
    }
  }
  return {referencedObjectTypes, otherObjectTypes};
}

function resolveType<TObject extends {readonly kind: 'ClientObjectType'}>(
  type: types.TypeNode,
  {
    resolveLiteralType,
    resolveNamedType,
  }: {
    resolveLiteralType: (
      t:
        | types.BooleanTypeNode
        | types.FloatTypeNode
        | types.IdTypeNode
        | types.IntTypeNode
        | types.StringTypeNode,
    ) => clientTypes.TypeNode<TObject>;
    resolveNamedType: (t: types.NameNode) => clientTypes.TypeNode<TObject>;
  },
): clientTypes.TypeNode<TObject> {
  switch (type.kind) {
    case 'BooleanType':
    case 'FloatType':
    case 'IdType':
    case 'IntType':
    case 'StringType':
      return resolveLiteralType(type);
    case 'NullableType':
      return nullableOfType(
        resolveType(type.ofType, {resolveLiteralType, resolveNamedType}),
      );
    case 'ListType':
      return {
        kind: 'ClientListType',
        ofType: resolveType(type.ofType, {
          resolveLiteralType,
          resolveNamedType,
        }),
      };
    case 'Name': {
      return resolveNamedType(type);
    }
    default:
      return assertNever(type);
  }
}

function resolveOutputType(
  type: types.TypeNode,
  field: types.FieldNode,
  {document}: {document: GraphQlDocument},
): clientTypes.OutputTypeNode {
  return resolveType(type, {
    resolveLiteralType: (type) => {
      if (field.selectionSet) {
        return errors.throwGraphQlError(
          `UNEXPECTED_SELECTION_SET`,
          `Cannot pass a selection set to the field "${field.name.value}"`,
          {loc: field.loc},
        );
      }
      return type;
    },
    resolveNamedType: (type) => {
      const result = document.getTypeX(type);
      switch (result.kind) {
        case 'InputObjectTypeDefinition':
          return errors.throwGraphQlError(
            `INVALID_OUTPUT_TYPE`,
            `Cannot have an input object as the return type for "${field.name.value}"`,
            {loc: field.loc},
          );
        case 'EnumTypeDefinition':
        case 'ScalarTypeDefinition':
          if (field.selectionSet) {
            return errors.throwGraphQlError(
              `UNEXPECTED_SELECTION_SET`,
              `Cannot pass a selection set to the field "${field.name.value}"`,
              {loc: field.loc},
            );
          }
          return result;
        case 'InterfaceTypeDefinition':
        case 'ObjectTypeDefinition':
        case 'UnionTypeDefinition':
          if (!field.selectionSet) {
            return errors.throwGraphQlError(
              `MISSING_SELECTION_SET`,
              `You must pass a selection set to the field "${field.name.value}"`,
              {loc: field.loc},
            );
          }
          return getResultTypeForSelectionSet(result, field.selectionSet, {
            document,
          });
      }
    },
  });
}

function resolveInputTypeForOperation(
  type: types.TypeNode,
  {document}: {document: GraphQlDocument},
): clientTypes.InputTypeNode {
  return resolveType(type, {
    resolveLiteralType: (type) => {
      return type;
    },
    resolveNamedType: (type) => {
      const result = document.getTypeX(type);
      switch (result.kind) {
        case 'InputObjectTypeDefinition':
          return {
            kind: 'ClientObjectType',
            name: result.name,
            fields: result.fields.map(
              (f): clientTypes.FieldNode<clientTypes.InputObjectTypeNode> => ({
                kind: 'ClientField',
                description: f.description,
                loc: f.loc,
                name: f.name,
                type: resolveInputTypeForOperation(f.type, {document}),
              }),
            ),
          };
        case 'EnumTypeDefinition':
        case 'ScalarTypeDefinition':
          return result;
        case 'InterfaceTypeDefinition':
        case 'ObjectTypeDefinition':
        case 'UnionTypeDefinition':
          return errors.throwGraphQlError(
            `INVALID_INPUT_TYPE`,
            `You cannot use an interface, object or union as an input`,
            {loc: type.loc},
          );
      }
    },
  });
}

export function objectTypeMatchesCondition(
  type: types.ObjectTypeDefinitionNode,
  typeCondition: types.NameNode,
  {document}: {document: GraphQlDocument},
): boolean {
  const t = document.getTypeX(typeCondition);
  switch (t.kind) {
    case 'ObjectTypeDefinition':
      return type.name.value === t.name.value;
    case 'InterfaceTypeDefinition':
      return type.interfaces.some((i) => i.value === t.name.value);
    case 'UnionTypeDefinition':
      return t.types.some((t) =>
        objectTypeMatchesCondition(type, t, {document}),
      );
    default:
      return errors.throwGraphQlError(
        `INVALID_TYPE_CONDITION`,
        `Expected type condition to refer to an object or union`,
        {loc: typeCondition.loc},
      );
  }
}

function getResultTypeForObject(
  type: types.ObjectTypeDefinitionNode,
  selectionSet: types.SelectionSetNode,
  {document}: {document: GraphQlDocument},
): clientTypes.OutputObjectTypeNode {
  const fields: clientTypes.FieldNode<clientTypes.OutputObjectTypeNode>[] = [];
  for (const selection of selectionSet.selections) {
    switch (selection.kind) {
      case 'Field': {
        if (selection.name.value === '__typename') {
          if (selection.arguments.length) {
            return errors.throwGraphQlError(
              `INVALID_ARGS`,
              `Cannot pass arguments to the builtin field "__typename"`,
              {loc: selection.loc},
            );
          }
          if (selection.selectionSet) {
            return errors.throwGraphQlError(
              `UNEXPECTED_SELECTION_SET`,
              `Cannot pass a selection set to the builtin field "__typename"`,
              {loc: selection.loc},
            );
          }
          fields.push({
            kind: 'ClientField',
            name: selection.alias,
            loc: selection.loc,
            type: {
              kind: 'ClientTypeNameType',
              name: type.name,
            },
          });
        } else {
          const fieldSource = type.fields.find(
            (f) => f.name.value === selection.name.value,
          );
          if (!fieldSource) {
            return errors.throwGraphQlError(
              `MISSING_FIELD`,
              `Unable to find field "${selection.name.value}" on object "${type.name.value}"`,
              {loc: selection.loc},
            );
          }
          // TODO: validate arguments
          fields.push({
            kind: 'ClientField',
            description: fieldSource.description,
            name: selection.alias,
            loc: selection.loc,
            type: resolveOutputType(fieldSource.type, selection, {document}),
          });
        }
        break;
      }
      case 'InlineFragment': {
        if (
          !selection.typeCondition ||
          objectTypeMatchesCondition(type, selection.typeCondition, {document})
        ) {
          fields.push(
            ...getResultTypeForObject(type, selection.selectionSet, {document})
              .fields,
          );
        }
        break;
      }
      case 'FragmentSpread': {
        const fragment = document.getFragmentX(selection.name);
        if (
          objectTypeMatchesCondition(type, fragment.typeCondition, {document})
        ) {
          fields.push(
            ...getResultTypeForObject(type, fragment.selectionSet, {document})
              .fields,
          );
        }
        break;
      }
    }
  }
  return {
    kind: 'ClientObjectType',
    name: type.name,
    fields,
  };
}

function getResultTypeForSelectionSet(
  type:
    | types.ObjectTypeDefinitionNode
    | types.InterfaceTypeDefinitionNode
    | types.UnionTypeDefinitionNode,
  selectionSet: types.SelectionSetNode,
  {document}: {document: GraphQlDocument},
):
  | clientTypes.OutputObjectTypeNode
  | clientTypes.UnionTypeNode<
      clientTypes.OutputObjectTypeNode,
      clientTypes.OutputObjectTypeNode
    > {
  if (type.kind === 'ObjectTypeDefinition') {
    const referencedTypeNames = getReferencedTypeNames(selectionSet, {
      document,
    });
    for (const name of referencedTypeNames) {
      if (name.value !== type.name.value) {
        // TODO: make this error use the parent location for the fragment
        return errors.throwGraphQlError(
          `TYPE_CONFLICT`,
          `The selection of ${name.value} does not match the type ${type.name.value}`,
          {loc: name.loc},
        );
      }
    }
    return getResultTypeForObject(type, selectionSet, {document});
  }
  const {referencedObjectTypes, otherObjectTypes} = groupObjectTypes(
    type,
    selectionSet,
    {document},
  );
  const resultTypes: clientTypes.OutputObjectTypeNode[] = [];

  let base: clientTypes.OutputObjectTypeNode | null = null;
  const fieldTypes = new Map<
    string,
    clientTypes.TypeNode<clientTypes.OutputObjectTypeNode>[]
  >();
  for (const type of otherObjectTypes) {
    const resultType = getResultTypeForObject(type, selectionSet, {document});
    if (base === null) {
      base = resultType;
    }
    for (const field of resultType.fields) {
      fieldTypes.get(field.name.value)?.push(field.type) ??
        fieldTypes.set(field.name.value, [field.type]);
    }
  }
  if (base) {
    resultTypes.push({
      kind: 'ClientObjectType',
      fields: base.fields
        .map((f) => {
          const typesForF = fieldTypes.get(f.name.value);
          if (typesForF?.length !== otherObjectTypes.length) {
            return null;
          }
          return {
            ...f,
            outputType: unionOfTypes(typesForF),
          };
        })
        .filter(<T>(v: T): v is Exclude<T, null> => v !== null),
    });
  }

  for (const type of referencedObjectTypes) {
    resultTypes.push(getResultTypeForObject(type, selectionSet, {document}));
  }

  if (resultTypes.length === 1) {
    return resultTypes[0];
  } else {
    return {
      kind: 'ClientUnionType',
      types: resultTypes,
    };
  }
}

function getRootTypeForOperation(
  operation: types.OperationDefinitionNode,
  {document}: {document: GraphQlDocument},
): types.ObjectTypeDefinitionNode {
  switch (operation.operation) {
    case 'query':
      return document.getObjectTypeDefinitionX({
        kind: 'Name',
        value: 'Query',
        loc: operation.loc,
      });
    case 'mutation':
      return document.getObjectTypeDefinitionX({
        kind: 'Name',
        value: 'Mutation',
        loc: operation.loc,
      });
    case 'subscription':
      // TODO: subscriptions are a little bit different. We should figure out how best to handle them.
      return document.getObjectTypeDefinitionX({
        kind: 'Name',
        value: 'Subscription',
        loc: operation.loc,
      });
  }
}

export function getResultTypeForOperation(
  operation: types.OperationDefinitionNode,
  {document}: {document: GraphQlDocument},
): clientTypes.OutputObjectTypeNode {
  const type = getRootTypeForOperation(operation, {document});
  return getResultTypeForObject(type, operation.selectionSet, {document});
}

export function getResultTypeForFragment(
  operation: types.FragmentDefinitionNode,
  {document}: {document: GraphQlDocument},
):
  | clientTypes.OutputObjectTypeNode
  | clientTypes.UnionTypeNode<
      clientTypes.OutputObjectTypeNode,
      clientTypes.OutputObjectTypeNode
    > {
  const type = document.getTypeX(operation.typeCondition);
  if (
    type.kind !== 'ObjectTypeDefinition' &&
    type.kind !== 'UnionTypeDefinition' &&
    type.kind !== 'InterfaceTypeDefinition'
  ) {
    errors.throwGraphQlError(
      `INVALID_TYPE_CONDITION`,
      `A fragment cannot reference the ${type.kind}, "${operation.typeCondition.value}"`,
      {loc: operation.typeCondition.loc},
    );
  }
  return getResultTypeForSelectionSet(type, operation.selectionSet, {document});
}

export function getInputTypeForOperation(
  operation: types.OperationDefinitionNode | types.FragmentDefinitionNode,
  {document}: {document: GraphQlDocument},
): readonly clientTypes.FieldNode<clientTypes.InputObjectTypeNode>[] {
  return operation.variableDefinitions.map(
    (
      variableDefinition,
    ): clientTypes.FieldNode<clientTypes.InputObjectTypeNode> => {
      const t = resolveInputTypeForOperation(variableDefinition.type, {
        document,
      });
      return {
        kind: 'ClientField',
        loc: variableDefinition.loc,
        name: variableDefinition.variable.name,
        type: variableDefinition.defaultValue ? nullableOfType(t) : t,
      };
    },
  );
}
