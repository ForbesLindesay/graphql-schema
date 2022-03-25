import type {FieldTypeOptions} from '@graphql-schema/build-typescript-declarations';
import {
  comment,
  getArgumentsType,
  getOutputType,
} from '@graphql-schema/build-typescript-declarations';
import type {types} from '@graphql-schema/document';
import type GraphQlDocument from '@graphql-schema/document';
import type {ITypeScriptWriter} from '@graphql-schema/typescript-writer';

export interface ScalarResolversConfig {
  interfaceName?: string;
  methodName?: string;
  useOptionalProps?: boolean;
}

export function buildScalarTypesInterface(
  document: GraphQlDocument,
  {
    writer,
    config: {interfaceName = `GraphQLScalarTypes`, useOptionalProps = false},
  }: {
    writer: ITypeScriptWriter;
    config: Omit<ScalarResolversConfig, 'methodName'>;
  },
): void {
  let addedImport = false;
  const scalars = [];
  for (const t of document.getScalarTypeDefinitions({
    includeReferencedDocuments: true,
  })) {
    if (!addedImport) {
      addedImport = true;
      writer.addImport({
        localName: 'ScalarImplementation',
        importedName: 'ScalarImplementation',
        packageName: '@graphql-schema/typescript-server',
      });
      writer.addDeclaration([], `export type {ScalarImplementation};`);
    }

    scalars.push(
      comment(t, `  `)`readonly ${t.name.value}${
        useOptionalProps ? `?` : ``
      }: ScalarImplementation<${t.name.value}>;`,
    );
  }
  writer.addDeclaration(
    [interfaceName],
    `export interface ${interfaceName} {\n${scalars.join(`\n`)}\n}`,
  );
}

export function buildScalarFactory(
  document: GraphQlDocument,
  {
    writer,
    config: {
      interfaceName = `GraphQLScalarTypes`,
      methodName = `defineScalars`,
    },
  }: {
    writer: ITypeScriptWriter;
    config: Pick<ScalarResolversConfig, 'interfaceName' | 'methodName'>;
  },
): void {
  writer.addImport({
    localName: 'createScalarFactory',
    importedName: 'createScalarFactory',
    packageName: '@graphql-schema/typescript-server',
  });
  const descriptions = [];
  for (const t of document.getScalarTypeDefinitions({
    includeReferencedDocuments: true,
  })) {
    descriptions.push(
      `   ${t.name.value}: ${JSON.stringify(t.description ?? '')},`,
    );
  }
  writer.addDeclaration(
    [methodName],
    `export const ${methodName} = createScalarFactory<${interfaceName}>({\n${descriptions.join(
      `\n`,
    )}\n})`,
  );
}

export interface ObjectResolversConfig {
  contextType: string;
  helpersName: string;
  allowUndefinedAsNull: boolean;
  useReadonlyArrays: boolean;
}

function getArgumentsTypeName(
  obj: types.ObjectTypeDefinitionNode,
  field: types.FieldDefinitionNode,
): string {
  if (!field.arguments.length) return `unknown`;
  return `${obj.name.value}_${pascalCase(field.name.value)}_Args`;
}

function getResultTypeName(
  obj: types.ObjectTypeDefinitionNode | types.InterfaceTypeDefinitionNode,
  field: types.FieldDefinitionNode,
): string {
  return `${obj.name.value}_${pascalCase(field.name.value)}`;
}

export function buildArgTypes(
  document: GraphQlDocument,
  {
    writer,
    config: {
      useReadonlyProps,
      useReadonlyArrays,
      allowUndefinedAsNull,
      makeNullablePropertiesOptional,
    },
  }: {
    writer: ITypeScriptWriter;
    config: Pick<
      FieldTypeOptions,
      | 'useReadonlyProps'
      | 'useReadonlyArrays'
      | 'allowUndefinedAsNull'
      | 'makeNullablePropertiesOptional'
    >;
  },
): void {
  for (const obj of document.getObjectTypeDefinitions({
    includeReferencedDocuments: true,
  })) {
    for (const field of obj.fields) {
      if (field.arguments.length) {
        const interfaceName = getArgumentsTypeName(obj, field);
        writer.addDeclaration(
          [interfaceName],
          `export interface ${interfaceName} ${getArgumentsType(
            field.arguments,
            {
              useReadonlyProps,
              useReadonlyArrays,
              allowUndefinedAsNull,
              makeNullablePropertiesOptional,
            },
          )}`,
        );
      }
    }
  }
}

export function buildResultTypes(
  document: GraphQlDocument,
  {
    writer,
    config,
  }: {
    writer: ITypeScriptWriter;
    config: Pick<
      ObjectResolversConfig,
      'allowUndefinedAsNull' | 'useReadonlyArrays'
    >;
  },
): void {
  for (const obj of document.getObjectTypeDefinitions({
    includeReferencedDocuments: true,
  })) {
    for (const field of obj.fields) {
      const typeName = getResultTypeName(obj, field);
      writer.addDeclaration(
        [typeName],
        `export type ${typeName} = ${getOutputType(field.type, config)};`,
      );
    }
  }
}

export function buildResolverTypeDeclarations(
  document: GraphQlDocument,
  {
    writer,
    config: {contextType},
  }: {
    writer: ITypeScriptWriter;
    config: Pick<ObjectResolversConfig, 'contextType'>;
  },
): void {
  for (const obj of document.getObjectTypeDefinitions({
    includeReferencedDocuments: true,
  })) {
    const interfaceName = `${obj.name.value}Resolvers`;
    writer.addImport({
      localName: `GraphQLResolveInfo`,
      importedName: `GraphQLResolveInfo`,
      packageName: `graphql/type/definition`,
    });
    writer.addDeclaration(
      [interfaceName],
      [
        `export interface ${interfaceName} {`,
        ...obj.fields.map(
          (field) =>
            `  readonly ${field.name.value}: (parent: ${
              obj.name.value === `Query` || obj.name.value === `Mutation`
                ? `unknown`
                : obj.name.value
            }, args: ${getArgumentsTypeName(
              obj,
              field,
            )}, ctx: ${contextType}, info: GraphQLResolveInfo) => Promise<${getResultTypeName(
              obj,
              field,
            )}> | ${getResultTypeName(obj, field)}`,
        ),
        `}`,
      ].join(`\n`),
    );
  }

  writer.addDeclaration(
    [`AllObjectResolvers`],
    [
      `export interface AllObjectResolvers {`,
      ...document
        .getObjectTypeDefinitions({includeReferencedDocuments: true})
        .map(
          (obj) => `  readonly ${obj.name.value}: ${obj.name.value}Resolvers;`,
        ),
      `}`,
    ].join(`\n`),
  );
}

export function buildResolverHelpers(
  document: GraphQlDocument,
  {
    writer,
    config: {contextType, helpersName},
  }: {
    writer: ITypeScriptWriter;
    config: Pick<ObjectResolversConfig, 'contextType' | 'helpersName'>;
  },
) {
  if (
    document.getObjectTypeDefinition('Query') ||
    document.getObjectTypeDefinition('Mutation')
  ) {
    writer.addImport({
      localName: 'getHelpersForRootObject',
      importedName: 'getHelpersForRootObject',
      packageName: '@graphql-schema/typescript-server',
    });
  }
  if (
    document
      .getObjectTypeDefinitions({includeReferencedDocuments: true})
      .some(
        (obj) => !(obj.name.value === 'Query' || obj.name.value === 'Mutation'),
      )
  ) {
    writer.addImport({
      localName: 'getHelpersForObject',
      importedName: 'getHelpersForObject',
      packageName: '@graphql-schema/typescript-server',
    });
  }
  writer.addDeclaration(
    [helpersName],
    [
      `export const ${helpersName} = {`,
      ...document
        .getObjectTypeDefinitions({includeReferencedDocuments: true})
        .map((obj) =>
          obj.name.value === 'Query' || obj.name.value === 'Mutation'
            ? `  ${obj.name.value}: getHelpersForRootObject<${contextType}, ${obj.name.value}Resolvers>()`
            : `  ${obj.name.value}: getHelpersForObject<${obj.name.value}, ${contextType}, ${obj.name.value}Resolvers>(),`,
        ),
      `} as const;`,
    ].join(`\n`),
  );
}

function pascalCase(str: string) {
  return str[0].toUpperCase() + str.substr(1);
}
