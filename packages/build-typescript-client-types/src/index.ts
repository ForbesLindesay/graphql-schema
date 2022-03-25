import assertNever from 'assert-never';

import type {clientTypes} from '@graphql-schema/client-types';
import {
  getResultTypeForOperation,
  getInputTypeForOperation,
  getResultTypeForFragment,
} from '@graphql-schema/client-types';
import type {types} from '@graphql-schema/document';
import type GraphQlDocument from '@graphql-schema/document';
import {errors} from '@graphql-schema/document';
import type {ITypeScriptWriter} from '@graphql-schema/typescript-writer';

function addParentheses(enabled: boolean, str: string) {
  if (enabled) return `(${str})`;
  else return str;
}
function getClientType<TObject extends {readonly kind: 'ClientObjectType'}>(
  type: clientTypes.TypeNode<TObject>,
  {
    parentheses,
    nullType,
    useReadonly,
    getClientObjectType,
    getScalarType,
    getEnumType,
  }: {
    parentheses: boolean;
    nullType: string;
    useReadonly: boolean;
    getClientObjectType: (type: TObject) => string;
    getScalarType: (type: clientTypes.ScalarTypeDefinitionNode) => string;
    getEnumType: (type: clientTypes.EnumTypeDefinitionNode) => string;
  },
): string {
  switch (type.kind) {
    case 'ClientUnionType':
      return addParentheses(
        parentheses,
        type.types
          .map((type) =>
            getClientType(type, {
              parentheses: false,
              nullType,
              useReadonly,
              getClientObjectType,
              getScalarType,
              getEnumType,
            }),
          )
          .join(` | `),
      );
    case 'ClientTypeNameType':
      return JSON.stringify(type.name.value);
    case 'ClientObjectType':
      return getClientObjectType(type);
    case 'ClientNullType':
      return addParentheses(
        parentheses,
        `${nullType} | ${getClientType(type.ofType, {
          parentheses: true,
          nullType,
          useReadonly,
          getClientObjectType,
          getScalarType,
          getEnumType,
        })}`,
      );
    case 'ClientListType':
      return addParentheses(
        parentheses,
        `${useReadonly ? `readonly ` : ``}${getClientType(type.ofType, {
          parentheses: true,
          nullType,
          useReadonly,
          getClientObjectType,
          getScalarType,
          getEnumType,
        })}[]`,
      );
    case 'BooleanType':
      return `boolean`;
    case 'FloatType':
    case 'IntType':
      return `number`;
    case 'IdType':
    case 'StringType':
      return `string`;
    case 'ScalarTypeDefinition':
      return getScalarType(type);
    case 'EnumTypeDefinition':
      return getEnumType(type);
    default:
      return assertNever(type);
  }
}

function buildObjectType(
  path: readonly string[],
  type: clientTypes.OutputObjectTypeNode,
  {
    useReadonly,
    writer,
    getScalarType,
    getEnumType,
  }: {
    useReadonly: boolean;
    writer: ITypeScriptWriter;
    getScalarType: (type: clientTypes.ScalarTypeDefinitionNode) => string;
    getEnumType: (type: clientTypes.EnumTypeDefinitionNode) => string;
  },
): string {
  const name = path.map((s) => pascalCase(s)).join(`_`);
  writer.addDeclaration(
    [name],
    [
      `export interface ${name} {`,
      ...type.fields.map(
        (f) =>
          `  ${useReadonly ? `readonly ` : ``}${f.name.value}: ${getClientType(
            f.type,
            {
              parentheses: false,
              nullType: `null`,
              useReadonly,
              getScalarType,
              getEnumType,
              getClientObjectType: (type) =>
                buildObjectType(
                  [
                    ...path,
                    f.name.value,
                    ...(type.name ? [type.name.value] : []),
                  ],
                  type,
                  {
                    useReadonly,
                    writer,
                    getScalarType,
                    getEnumType,
                  },
                ),
            },
          )};`,
      ),
      `}`,
    ].join(`\n`),
  );
  return name;
}

export function buildFragmentType(
  operation: types.FragmentDefinitionNode,
  {
    document,
    useReadonly,
    writer,
    getScalarType,
    getEnumType,
  }: {
    document: GraphQlDocument;
    useReadonly: boolean;
    writer: ITypeScriptWriter;
    getScalarType: (type: clientTypes.ScalarTypeDefinitionNode) => string;
    getEnumType: (type: clientTypes.EnumTypeDefinitionNode) => string;
  },
): void {
  const operationName = operation.name;
  const clientType = getResultTypeForFragment(operation, {document});
  switch (clientType.kind) {
    case 'ClientUnionType':
      writer.addDeclaration(
        [operationName.value],
        [
          `export type ${operationName.value} =`,
          ...clientType.types.map((t) =>
            buildObjectType(
              t.name
                ? [operationName.value, t.name.value]
                : [operationName.value],
              t,
              {
                useReadonly,
                writer,
                getScalarType,
                getEnumType,
              },
            ),
          ),
        ].join(`\n`),
      );
      break;
    case 'ClientObjectType':
      buildObjectType([operationName.value], clientType, {
        useReadonly,
        writer,
        getScalarType,
        getEnumType,
      });
      break;
    default:
      return assertNever(clientType);
  }
}

export function buildOperationType(
  operation: types.OperationDefinitionNode,
  {
    document,
    useReadonlyInputs,
    useReadonlyOutputs,
    writer,
    getScalarType,
    getEnumType,
  }: {
    document: GraphQlDocument;
    useReadonlyInputs: boolean;
    useReadonlyOutputs: boolean;
    writer: ITypeScriptWriter;
    getScalarType: (type: clientTypes.ScalarTypeDefinitionNode) => string;
    getEnumType: (type: clientTypes.EnumTypeDefinitionNode) => string;
  },
) {
  if (!operation.name) {
    return errors.throwGraphQlError(
      `ANONYMOUS_OPERATION`,
      `Cannot generate type for anonymous operation`,
      {
        loc: operation.loc,
      },
    );
  }
  const inputFields = getInputTypeForOperation(operation, {document});
  const clientType = getResultTypeForOperation(operation, {document});

  const operationName = pascalCase(operation.name.value);
  const inputName = `${operationName}_Variables`;
  const outputName = `${operationName}_Result`;
  writer.addDeclaration(
    [inputName],
    [
      `export interface ${inputName} {`,
      ...inputFields.map(
        (f) =>
          `  ${useReadonlyInputs ? `readonly ` : ``}${f.name.value}${
            f.type.kind === 'ClientNullType' ? `?` : ``
          }: ${getClientType(f.type, {
            parentheses: false,
            nullType: `null | undefined`,
            useReadonly: useReadonlyInputs,
            getScalarType,
            getEnumType,
            getClientObjectType: (type) => type.name.value,
          })};`,
      ),
      `}`,
    ].join(`\n`),
  );
  writer.addDeclaration(
    [outputName],
    [
      `export interface ${outputName} {`,
      ...clientType.fields.map(
        (f) =>
          `  ${useReadonlyInputs ? `readonly ` : ``}${
            f.name.value
          }: ${getClientType(f.type, {
            parentheses: false,
            nullType: `null`,
            useReadonly: useReadonlyOutputs,
            getScalarType,
            getEnumType,
            getClientObjectType: (type) =>
              buildObjectType(
                [
                  outputName,
                  f.name.value,
                  ...(type.name ? [type.name.value] : []),
                ],
                type,
                {
                  useReadonly: useReadonlyOutputs,
                  writer,
                  getScalarType,
                  getEnumType,
                },
              ),
          })};`,
      ),
      `}`,
    ].join(`\n`),
  );
  return {
    operationName,
    inputName,
    outputName,
    hasInputs: inputFields.length,
    hasRequiredInputs: inputFields.some(
      (i) => i.type.kind !== 'ClientNullType',
    ),
  };
}

function pascalCase(s: string) {
  return s[0].toUpperCase() + s.substr(1);
}
