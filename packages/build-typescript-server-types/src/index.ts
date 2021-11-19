import type {GraphQLResolverObject} from '@graphql-schema/build-typescript-declarations';
import {
  comment,
  getArgumentsType,
  getOutputType,
  isBuiltinType,
  FieldTypeOptions,
} from '@graphql-schema/build-typescript-declarations';
import {ITypeScriptWriter} from '@graphql-schema/typescript-writer';
import {GraphQLNamedType, isScalarType} from 'graphql';

export interface ScalarResolversConfig {
  interfaceName?: string;
  methodName?: string;
  useOptionalProps?: boolean;
}

export function buildScalarTypesInterface(
  schema: readonly GraphQLNamedType[],
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
  for (const t of schema) {
    if (isScalarType(t) && !isBuiltinType(t.name)) {
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
        comment(t, `  `)`readonly ${t.name}${
          useOptionalProps ? `?` : ``
        }: ScalarImplementation<${t.name}>;`,
      );
    }
  }
  writer.addDeclaration(
    [interfaceName],
    `export interface ${interfaceName} {\n${scalars.join(`\n`)}\n}`,
  );
}

export function buildScalarFactory(
  schema: readonly GraphQLNamedType[],
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
  for (const t of schema) {
    if (isScalarType(t) && !isBuiltinType(t.name)) {
      descriptions.push(
        `   ${t.name}: ${JSON.stringify(t.description ?? '')},`,
      );
    }
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

export function buildArgTypes(
  schema: ReadonlyMap<string, GraphQLResolverObject>,
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
  for (const [objectName, obj] of schema) {
    for (const [fieldName, field] of obj.fields) {
      if (field.args.length) {
        const interfaceName = `${objectName}_${fieldName}_Args`;
        writer.addDeclaration(
          [interfaceName],
          `export interface ${interfaceName} ${getArgumentsType(field.args, {
            useReadonlyProps,
            useReadonlyArrays,
            allowUndefinedAsNull,
            makeNullablePropertiesOptional,
          })}`,
        );
      }
    }
  }
}

export function buildResultTypes(
  schema: ReadonlyMap<string, GraphQLResolverObject>,
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
  for (const [objectName, obj] of schema) {
    for (const [fieldName, field] of obj.fields) {
      const typeName = `${objectName}_${fieldName}`;
      writer.addDeclaration(
        [typeName],
        `export type ${typeName} = ${getOutputType(field.type, config)};`,
      );
    }
  }
}

export function buildResolverTypeDeclarations(
  schema: ReadonlyMap<string, GraphQLResolverObject>,
  {
    writer,
    config: {contextType},
  }: {
    writer: ITypeScriptWriter;
    config: Pick<ObjectResolversConfig, 'contextType'>;
  },
): void {
  for (const [objectName, obj] of schema) {
    const interfaceName = `${objectName}Resolvers`;
    writer.addImport({
      localName: `GraphQLResolveInfo`,
      importedName: `GraphQLResolveInfo`,
      packageName: `graphql/type/definition`,
    });
    writer.addDeclaration(
      [interfaceName],
      [
        `export interface ${objectName}Resolvers {`,
        ...[...obj.fields].map(
          ([fieldName, field]) =>
            `  readonly ${fieldName}: (parent: ${
              objectName === `Query` || objectName === `Mutation`
                ? `unknown`
                : objectName
            }, args: ${
              field.args.length ? `${objectName}_${fieldName}_Args` : `unknown`
            }, ctx: ${contextType}, info: GraphQLResolveInfo) => Promise<${objectName}_${fieldName}> | ${objectName}_${fieldName}`,
        ),
        `}`,
      ].join(`\n`),
    );
  }

  writer.addDeclaration(
    [`AllObjectResolvers`],
    [
      `export interface AllObjectResolvers {`,
      ...[...schema].map(([objectName]) =>
        [`  readonly ${objectName}: ${objectName}Resolvers;`].join(`\n`),
      ),
      `}`,
    ].join(`\n`),
  );
}

export function buildResolverHelpers(
  schema: ReadonlyMap<string, GraphQLResolverObject>,
  {
    writer,
    config: {contextType, helpersName},
  }: {
    writer: ITypeScriptWriter;
    config: Pick<ObjectResolversConfig, 'contextType' | 'helpersName'>;
  },
) {
  if (schema.has('Query') || schema.has('Mutation')) {
    writer.addImport({
      localName: 'getHelpersForRootObject',
      importedName: 'getHelpersForRootObject',
      packageName: '@graphql-schema/typescript-server',
    });
  }
  if (
    [...schema.keys()].some(
      (objectName) => !(objectName === 'Query' || objectName === 'Mutation'),
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
      ...[...schema.keys()]
        .sort()
        .map((objectName) =>
          objectName === 'Query' || objectName === 'Mutation'
            ? `  ${objectName}: getHelpersForRootObject<${contextType}, ${objectName}Resolvers>()`
            : `  ${objectName}: getHelpersForObject<${objectName}, ${contextType}, ${objectName}Resolvers>(),`,
        ),
      `} as const;`,
    ].join(`\n`),
  );
}
