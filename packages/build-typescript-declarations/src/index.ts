import type {types} from '@graphql-schema/document';
import type GraphQlDocument from '@graphql-schema/document';
import type {ITypeScriptWriter} from '@graphql-schema/typescript-writer';

import getTypeScriptType from './graphQLTypeToTypeScript';

export enum EnumMode {
  StringLiterals = 'STRING_LITERALS',
  EnumDeclaration = 'ENUM_DECLARATION',
  EnumImport = 'ENUM_IMPORT',
}

export interface EnumConfigStringLiterals {
  mode: EnumMode.StringLiterals;
  /**
   * Generate an object mapping key names onto the string values
   *
   * @default false
   */
  generateObjectMapping?: boolean;
}

export interface EnumConfigEnumDeclaration {
  mode: EnumMode.EnumDeclaration;
  /**
   * Generate a `const` enum.
   *
   * This is not recommended because it makes it harder
   * to use compiler optimisations like isolatedModules.
   *
   * @default false
   */
  useConst?: boolean;
}

export interface EnumConfigEnumImport {
  mode: EnumMode.EnumImport;
  packageName: string;
  /**
   * Set this to true if the enums you are importing are defined
   * as `const` enums.
   *
   * @default false
   */
  useConst?: boolean;
  /**
   * The name to import. Defaults to the name of the enum.
   *
   * This only makes sense if you have a separate config for each
   * enum.
   */
  importName?: string;
}

export type EnumConfig =
  | EnumConfigStringLiterals
  | EnumConfigEnumDeclaration
  | EnumConfigEnumImport;

export enum ScalarMode {
  InlineType = 'InlineType',
  TypeImport = 'TypeImport',
}

export interface ScalarConfigInlineType {
  mode: ScalarMode.InlineType;
  type: string;
}

export interface ScalarConfigTypeImport {
  mode: ScalarMode.TypeImport;
  packageName: string;
  /**
   * The name to import. Defaults to the name of the scalar.
   *
   * This only makes sense if you have a separate config for each
   * scalar.
   */
  importName?: string;
}

export type ScalarConfig = ScalarConfigInlineType | ScalarConfigTypeImport;

export enum ObjectMode {
  TypeImport = 'TypeImport',
}

export interface ObjectConfigTypeImport {
  mode: ObjectMode.TypeImport;
  packageName: string;
  /**
   * The name to import. Defaults to the name of the Object.
   *
   * This only makes sense if you have a separate config for each
   * object.
   */
  importName?: string;
}

export type ObjectConfig = ObjectConfigTypeImport;

export interface FieldTypeOptions {
  /**
   * Override a given sub-type. Useful for getting the type for
   * a query result.
   *
   * N.B. All types should be treated as `NonNull` in the override
   *      and you can return `null` or `undefined` to indicate you
   *      do not want to override a given type.
   */
  readonly getOverride?: (type: types.TypeNode) => string | null | undefined;
  readonly useReadonlyProps: boolean;
  readonly useReadonlyArrays: boolean;
  readonly allowUndefinedAsNull: boolean;
  readonly makeNullablePropertiesOptional: boolean;
}

export function comment(
  t: {description?: types.StringValueNode | undefined},
  prefix: string = '',
) {
  const comment =
    t.description?.value && !t.description.value.includes(`*/`)
      ? [
          `/**`,
          ...t.description.value
            .split(`\n`)
            .map((line) => ` * ${line.trimRight()}`),
          ` */`,
        ]
      : [];
  return (src: TemplateStringsArray, ...names: string[]) => {
    return [
      ...comment,
      ...src
        .map((str, i) => (i === 0 ? `${str}` : `${names[i - 1]}${str}`))
        .join(``)
        .split(`\n`),
    ]
      .map((line) => (line.trim() ? `${prefix}${line}` : ``))
      .join(`\n`);
  };
}

function getField(
  prefix: string,
  f: types.InputValueDefinitionNode,
  {
    getOverride,
    useReadonlyProps,
    useReadonlyArrays,
    allowUndefinedAsNull,
    makeNullablePropertiesOptional,
  }: FieldTypeOptions,
) {
  const fieldName = useReadonlyProps
    ? `readonly ${f.name.value}`
    : f.name.value;

  const type =
    makeNullablePropertiesOptional && f.type.kind === 'NullableType'
      ? `?: ${getTypeScriptType(f.type.ofType, {
          getOverride,
          useReadonlyArrays,
          allowUndefinedAsNull,
        })} | null`
      : `: ${getTypeScriptType(f.type, {
          getOverride,
          useReadonlyArrays,
          allowUndefinedAsNull,
        })}`;

  return comment(f, prefix)`${fieldName}${type};`;
}

export function buildEnumDeclaration(
  declaration: types.EnumTypeDefinitionNode,
  {
    writer,
    config,
    checkEnumValues,
  }: {
    writer: ITypeScriptWriter;
    config: EnumConfig | ((e: types.EnumTypeDefinitionNode) => EnumConfig);
    checkEnumValues?: (options: {
      enumName: string;
      expectedValues: string[];
      importedName: string;
      packageName: string;
      enumType: types.EnumTypeDefinitionNode;
    }) => void;
  },
) {
  const c = typeof config === 'function' ? config(declaration) : config;
  if (c.mode === EnumMode.EnumImport) {
    writer.addImport({
      localName: declaration.name.value,
      importedName: c.importName ?? declaration.name.value,
      packageName: c.packageName,
    });
    if (c.useConst) {
      writer.addDeclaration(
        [],
        comment(declaration)`export type {${declaration.name.value}};`,
      );
    } else {
      writer.addDeclaration(
        [],
        comment(declaration)`export {${declaration.name.value}};`,
      );
    }
    if (checkEnumValues) {
      checkEnumValues({
        enumName: declaration.name.value,
        expectedValues: declaration.values.map((v) => v.name.value),
        importedName: c.importName ?? declaration.name.value,
        packageName: c.packageName,
        enumType: declaration,
      });
    }
  } else if (c.mode === EnumMode.StringLiterals) {
    writer.addDeclaration(
      [declaration.name.value],
      comment(declaration)`export type ${
        declaration.name.value
      } =\n${declaration.values
        .map((t) => comment(t, `  `)`| ${JSON.stringify(t.name.value)}`)
        .join(`\n`)};`,
    );
    if (c.generateObjectMapping) {
      writer.addDeclaration(
        [],
        comment(declaration)`export const ${
          declaration.name.value
        } = {\n${declaration.values
          .map(
            (t) =>
              comment(t, `  `)`${t.name.value}: ${JSON.stringify(
                t.name.value,
              )},`,
          )
          .join(`\n`)}\n} as const;`,
      );
    }
  } else {
    writer.addDeclaration(
      [declaration.name.value],
      comment(declaration)`export${c.useConst ? ` const` : ``} enum ${
        declaration.name.value
      } {\n${declaration.values
        .map(
          (t) =>
            comment(t, `  `)`${t.name.value} = ${JSON.stringify(
              t.name.value,
            )},`,
        )
        .join(`\n`)}\n}`,
    );
  }
}

export function buildScalarDeclaration(
  definition: types.ScalarTypeDefinitionNode,
  {
    writer,
    config,
  }: {
    writer: ITypeScriptWriter;
    config:
      | ScalarConfig
      | ((s: types.ScalarTypeDefinitionNode) => ScalarConfig);
  },
): void {
  const c = typeof config === 'function' ? config(definition) : config;
  if (c.mode === ScalarMode.InlineType) {
    writer.addDeclaration(
      [definition.name.value],
      comment(definition)`export type ${definition.name.value} = ${c.type};`,
    );
  } else {
    writer.addImport({
      localName: definition.name.value,
      importedName: c.importName ?? definition.name.value,
      packageName: c.packageName,
      asType: true,
    });
    writer.addDeclaration(
      [],
      comment(definition)`export type {${definition.name.value}};`,
    );
  }
}

export function buildUnionDeclaration(
  declaration: types.UnionTypeDefinitionNode,
  {writer}: {writer: ITypeScriptWriter},
): void {
  writer.addDeclaration(
    [declaration.name.value],
    comment(declaration)`export type ${
      declaration.name.value
    } =\n${declaration.types.map((t) => `  | ${t.value}`).join(`\n`)};`,
  );
}

export function buildInterfaceDeclaration(
  definition: types.InterfaceTypeDefinitionNode,
  {writer, document}: {writer: ITypeScriptWriter; document: GraphQlDocument},
): void {
  // We declare interfaces as Union types because we don't want resolvers
  // to return objects that are not one of the concrete types that implement
  // the interface
  writer.addDeclaration(
    [definition.name.value],
    comment(definition)`export type ${definition.name.value} =\n${document
      .getInterfaceImplementations(definition)
      .map((obj) => `  | ${obj.name.value}`)
      .join(`\n`)};`,
  );
}

export function buildInputObjectDeclaration(
  definition: types.InputObjectTypeDefinitionNode,
  {writer, config}: {writer: ITypeScriptWriter; config: FieldTypeOptions},
): void {
  writer.addDeclaration(
    [definition.name.value],
    comment(definition)`export interface ${
      definition.name.value
    } {\n${definition.fields
      .map((f) => getField(`  `, f, config))
      .join(`\n`)}\n}`,
  );
}

export function buildObjectDeclaration(
  definition: types.ObjectTypeDefinitionNode,
  {
    writer,
    config,
  }: {
    writer: ITypeScriptWriter;
    config:
      | ObjectConfig
      | ((s: types.ObjectTypeDefinitionNode) => ObjectConfig);
  },
): void {
  const c = typeof config === 'function' ? config(definition) : config;
  writer.addImport({
    localName: definition.name.value,
    importedName: c.importName ?? definition.name.value,
    packageName: c.packageName,
  });
  writer.addDeclaration(
    [],
    comment(definition)`export type {${definition.name.value}};`,
  );
}

export function getOutputType(
  type: types.TypeNode,
  {
    getOverride,
    allowUndefinedAsNull,
    useReadonlyArrays,
  }: Pick<
    FieldTypeOptions,
    'allowUndefinedAsNull' | 'useReadonlyArrays' | 'getOverride'
  >,
) {
  return getTypeScriptType(type, {
    getOverride,
    allowUndefinedAsNull,
    useReadonlyArrays,
  });
}

export function getArgumentsType(
  args: readonly types.InputValueDefinitionNode[],
  {
    prefix = '',
    useReadonlyProps,
    useReadonlyArrays,
    allowUndefinedAsNull,
    makeNullablePropertiesOptional,
  }: Pick<
    FieldTypeOptions,
    | 'useReadonlyProps'
    | 'useReadonlyArrays'
    | 'allowUndefinedAsNull'
    | 'makeNullablePropertiesOptional'
  > & {prefix?: string},
) {
  return `{\n${args.map((arg) =>
    getField(`${prefix}  `, arg, {
      useReadonlyProps,
      useReadonlyArrays,
      allowUndefinedAsNull,
      makeNullablePropertiesOptional,
    }),
  )}\n${prefix}}`;
}
