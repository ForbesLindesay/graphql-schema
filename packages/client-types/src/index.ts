import GraphQlDocument, {
  throwGraphQlError,
  types,
} from '@graphql-schema/document';
import assertNever from 'assert-never';
import * as clientTypes from './types';

export {clientTypes};

const typesEqualityCheckers: {
  [TKey in clientTypes.TypeNode['kind']]: (
    a: Extract<clientTypes.TypeNode, {readonly kind: TKey}>,
    b: Extract<clientTypes.TypeNode, {readonly kind: TKey}>,
  ) => boolean;
} = {
  ClientListType: (a, b) => typesEqual(a.ofType, b.ofType),
  ClientUnionType: (a, b) =>
    a.types.every((ta) => b.types.some((tb) => typesEqual(ta, tb))) &&
    b.types.every((tb) => a.types.some((ta) => typesEqual(ta, tb))),
  ClientNullType: () => true,
  ClientObjectType: () => false,
  ClientTypeNameType: (a, b) => a.name.value === b.name.value,
  BooleanType: () => true,
  FloatType: () => true,
  IdType: () => true,
  IntType: () => true,
  StringType: () => true,
  ScalarTypeDefinition: (a, b) => a.name.value === b.name.value,
  EnumTypeDefinition: (a, b) => a.name.value === b.name.value,
};

function typesEqual(a: clientTypes.TypeNode, b: clientTypes.TypeNode): boolean {
  return a.kind === b.kind && typesEqualityCheckers[a.kind](a as any, b as any);
}

function unionOfTypes(
  types: readonly clientTypes.TypeNode[],
): clientTypes.TypeNode {
  if (types.length === 1) return types[0];
  const resultTypes: clientTypes.TypeExceptUnionNode[] = [];
  for (const t of types.flatMap((t) =>
    t.kind === 'ClientUnionType' ? t.types : [t],
  )) {
    if (!resultTypes.some((rt) => typesEqual(t, rt))) {
      resultTypes.push(t);
    }
  }
  if (resultTypes.length === 1) return resultTypes[0];
  return {kind: 'ClientUnionType', types: resultTypes};
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

function resolveType(
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
    ) => clientTypes.TypeNode;
    resolveNamedType: (t: types.NameNode) => clientTypes.TypeNode;
  },
): clientTypes.TypeNode {
  switch (type.kind) {
    case 'BooleanType':
    case 'FloatType':
    case 'IdType':
    case 'IntType':
    case 'StringType':
      return resolveLiteralType(type);
    case 'NullableType':
      return unionOfTypes([
        {kind: 'ClientNullType'},
        resolveType(type.ofType, {resolveLiteralType, resolveNamedType}),
      ]);
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
): clientTypes.TypeNode {
  return resolveType(type, {
    resolveLiteralType: (type) => {
      if (field.selectionSet) {
        return throwGraphQlError(
          `Cannot pass a selection set to the field "${field.name.value}"`,
          {node: field},
        );
      }
      return type;
    },
    resolveNamedType: (type) => {
      const result = document.getTypeX(type);
      switch (result.kind) {
        case 'InputObjectTypeDefinition':
          return throwGraphQlError(
            `Cannot have an input object as the return type for "${field.name.value}"`,
            {node: field},
          );
        case 'EnumTypeDefinition':
        case 'ScalarTypeDefinition':
          if (field.selectionSet) {
            return throwGraphQlError(
              `Cannot pass a selection set to the field "${field.name.value}"`,
              {node: field},
            );
          }
          return result;
        case 'InterfaceTypeDefinition':
        case 'ObjectTypeDefinition':
        case 'UnionTypeDefinition':
          if (!field.selectionSet) {
            return throwGraphQlError(
              `You must pass a selection set to the field "${field.name.value}"`,
              {node: field},
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
): clientTypes.TypeNode {
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
              (f): clientTypes.FieldNode => ({
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
          return throwGraphQlError(
            `You cannot use an interface, object or union as an input`,
            {node: type},
          );
      }
    },
  });
}

function objectTypeMatchesCondition(
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
      return throwGraphQlError(
        `Expected type condition to refer to an object or union`,
        {node: typeCondition},
      );
  }
}

function getResultTypeForObject(
  type: types.ObjectTypeDefinitionNode,
  selectionSet: types.SelectionSetNode,
  {document}: {document: GraphQlDocument},
): clientTypes.ObjectTypeNode {
  const fields: clientTypes.FieldNode[] = [];
  for (const selection of selectionSet.selections) {
    switch (selection.kind) {
      case 'Field': {
        if (selection.name.value === '__typename') {
          if (selection.arguments.length) {
            return throwGraphQlError(
              `Cannot pass arguments to the builtin field "__typename"`,
              {node: selection},
            );
          }
          if (selection.selectionSet) {
            return throwGraphQlError(
              `Cannot pass a selection set to the builtin field "__typename"`,
              {node: selection},
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
            return throwGraphQlError(
              `Unable to find field "${selection.name.value}" on object "${type.name.value}"`,
              {node: selection},
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
): clientTypes.TypeNode {
  if (type.kind === 'ObjectTypeDefinition') {
    const referencedTypeNames = getReferencedTypeNames(selectionSet, {
      document,
    });
    for (const name of referencedTypeNames) {
      if (name.value !== type.name.value) {
        // TODO: make this error use the parent location for the fragment
        return throwGraphQlError(
          `The selection of ${name.value} does not match the type ${type.name.value}`,
          {node: name},
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
  const resultTypes: clientTypes.ObjectTypeNode[] = [];

  let base: clientTypes.ObjectTypeNode | null = null;
  const fieldTypes = new Map<string, clientTypes.TypeNode[]>();
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
      ...base,
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
  operation: types.OperationDefinitionNode | types.FragmentDefinitionNode,
  {document}: {document: GraphQlDocument},
) {
  switch (operation.kind) {
    case 'FragmentDefinition': {
      const type = document.getTypeX(operation.typeCondition);
      if (
        type.kind !== 'ObjectTypeDefinition' &&
        type.kind !== 'UnionTypeDefinition' &&
        type.kind !== 'InterfaceTypeDefinition'
      ) {
        throwGraphQlError(
          `A fragment cannot reference the ${type.kind}, "${operation.typeCondition.value}"`,
          {node: operation.typeCondition},
        );
      }
      return type;
    }
    case 'OperationDefinition':
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
}

export function getResultTypeForOperation(
  operation: types.OperationDefinitionNode | types.FragmentDefinitionNode,
  {document}: {document: GraphQlDocument},
): clientTypes.TypeNode {
  const type = getRootTypeForOperation(operation, {document});
  return getResultTypeForSelectionSet(type, operation.selectionSet, {document});
}

export function getInputTypeForOperation(
  operation: types.OperationDefinitionNode | types.FragmentDefinitionNode,
  {document}: {document: GraphQlDocument},
): clientTypes.TypeNode {
  return {
    kind: 'ClientObjectType',
    fields: operation.variableDefinitions.map(
      (variableDefinition): clientTypes.FieldNode => {
        const t = resolveInputTypeForOperation(variableDefinition.type, {
          document,
        });
        return {
          kind: 'ClientField',
          loc: variableDefinition.loc,
          name: variableDefinition.variable.name,
          type: variableDefinition.defaultValue
            ? unionOfTypes([{kind: 'ClientNullType'}, t])
            : t,
        };
      },
    ),
  };
}

// (property) VariableDefinitionNode.type: types.TypeNode
