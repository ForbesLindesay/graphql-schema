import GraphQlDocument, {
  throwGraphQlError,
  types,
} from '@graphql-schema/document';
import {
  comment,
  getArgumentsType,
  getOutputType,
  FieldTypeOptions,
} from '@graphql-schema/build-typescript-declarations';
import {ITypeScriptWriter} from '@graphql-schema/typescript-writer';
import path from 'path';

function getFieldType(
  type:
    | types.ObjectTypeDefinitionNode
    | types.InterfaceTypeDefinitionNode
    | types.UnionTypeDefinitionNode,
  field: types.FieldNode,
  {
    getSubType,
    document,
  }: {
    getSubType: (
      type:
        | types.ObjectTypeDefinitionNode
        | types.InterfaceTypeDefinitionNode
        | types.UnionTypeDefinitionNode,
      selectionSet: types.SelectionSetNode,
    ) => string;
    document: GraphQlDocument;
  },
): string {
  if (field.name.value === '__typename') {
    switch (type.kind) {
      case 'ObjectTypeDefinition':
        return JSON.stringify(type.name.value);
      case 'InterfaceTypeDefinition':
        return document
          .getInterfaceImplementations(type)
          .map((t) => JSON.stringify(t.name.value))
          .join(` | `);
      case 'UnionTypeDefinition':
        return type.types.map((name) => JSON.stringify(name.value)).join(` | `);
    }
  }
  switch (type.kind) {
    case 'ObjectTypeDefinition':
    case 'InterfaceTypeDefinition':
      const fieldDefinition = type.fields.find(
        (f) => f.name.value === field.name.value,
      );
      if (!fieldDefinition) {
        return throwGraphQlError(
          `Cannot find the field "${field.name.value}" on the object "${type.name.value}"`,
          {node: field},
        );
      }
      return getOutputType(fieldDefinition.type, {
        allowUndefinedAsNull: false,
        useReadonlyArrays: true,
        getOverride(typeName) {
          if (typeName.kind === 'Name') {
            const definition = document.getTypeX(typeName);
            if (
              definition.kind === 'UnionTypeDefinition' ||
              definition.kind === 'ObjectTypeDefinition' ||
              definition.kind === 'InterfaceTypeDefinition'
            ) {
              if (!field.selectionSet) {
                return throwGraphQlError(
                  `Missing selection set for the field "${field.name.value}" on the object "${type.name.value}"`,
                  {node: field},
                );
              }
              return getSubType(definition, field.selectionSet);
            } else if (field.selectionSet) {
              return throwGraphQlError(
                `Unexpected selection set for the field "${field.name.value}" on the object "${type.name.value}"`,
                {node: field},
              );
            }
          }
          return null;
        },
      });
    case 'UnionTypeDefinition':
      return throwGraphQlError(
        `Cannot directly query fields on a Union type "${type.name.value}", you must use a fragment with a type constraint.`,
        {node: field},
      );
  }
}

function getSelectionFieldTypes(
  type:
    | types.ObjectTypeDefinitionNode
    | types.InterfaceTypeDefinitionNode
    | types.UnionTypeDefinitionNode,
  selection: types.SelectionNode,
  {
    getTypeName,
    document,
  }: {
    getTypeName: (path: readonly string[]) => string;
    document: GraphQlDocument;
  },
): string[] {
  switch (selection.kind) {
    case 'Field':
      return [`readonly ${selection.name.value}: `];
  }
}
function buildSelectionSet(
  path: readonly string[],
  selectionSet: types.SelectionSetNode,
  {
    getTypeName,
    document,
    writer,
  }: {
    getTypeName: (path: readonly string[]) => string;
    document: GraphQlDocument;
    writer: ITypeScriptWriter;
  },
): void {
  const typeName = getTypeName(path);
  writer.addDeclaration(
    [typeName],
    [
      `export interface ${typeName} {`,
      ...selectionSet.selections.flatMap((s) => {
        if (s.kind === 'Field') {
        }
      }),
      `}`,
    ].join(`\n`),
  );
}
export function buildFragmentType(
  document: GraphQlDocument,
  fragment: types.FragmentDefinitionNode,
  {
    writer,
  }: {
    writer: ITypeScriptWriter;
  },
): void {
  writer.addDeclaration(
    [fragment.name.value],
    [
      `export interface ${fragment.name.value} {`,
      fragment.selectionSet.selections.flatMap((s) => {}),
      `}`,
    ].join(`\n`),
  );
}
