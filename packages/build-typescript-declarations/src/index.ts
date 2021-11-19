import {ITypeScriptWriter} from '@graphql-schema/typescript-writer';
import {
  GraphQLArgument,
  GraphQLEnumType,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isNonNullType,
  isObjectType,
  isScalarType,
  isUnionType,
} from 'graphql';
import {isBuiltinType, getBuiltinType} from './builtins';
import getTypeScriptType, {
  getTypeScriptTypeNotNull,
} from './graphQLTypeToTypeScript';

export {isBuiltinType, getBuiltinType};

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
  readonly getOverride?: (type: GraphQLType) => string | null | undefined;
  readonly useReadonlyProps: boolean;
  readonly useReadonlyArrays: boolean;
  readonly allowUndefinedAsNull: boolean;
  readonly makeNullablePropertiesOptional: boolean;
}

export function comment(
  t: {description?: string | null | undefined},
  prefix: string = '',
) {
  const comment =
    t.description && !t.description.includes(`*/`)
      ? [
          `/**`,
          ...t.description.split(`\n`).map((line) => ` * ${line.trimRight()}`),
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
  f: {name: string; description?: string | null | undefined; type: GraphQLType},
  {
    getOverride,
    useReadonlyProps,
    useReadonlyArrays,
    allowUndefinedAsNull,
    makeNullablePropertiesOptional,
  }: FieldTypeOptions,
) {
  const fieldName = useReadonlyProps ? `readonly ${f.name}` : f.name;

  const markAsOptional =
    makeNullablePropertiesOptional && !isNonNullType(f.type);
  const type = markAsOptional
    ? `?: ${getTypeScriptTypeNotNull(f.type, {
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

export function buildEnumDeclarations(
  schema: readonly GraphQLNamedType[],
  {
    writer,
    config,
    checkEnumValues,
  }: {
    writer: ITypeScriptWriter;
    config: EnumConfig | ((e: GraphQLEnumType) => EnumConfig);
    checkEnumValues?: (options: {
      enumName: string;
      expectedValues: string[];
      importedName: string;
      packageName: string;
      enumType: GraphQLEnumType;
    }) => void;
  },
) {
  for (const t of schema) {
    if (isEnumType(t)) {
      const c = typeof config === 'function' ? config(t) : config;
      if (c.mode === EnumMode.EnumImport) {
        writer.addImport({
          localName: t.name,
          importedName: c.importName ?? t.name,
          packageName: c.packageName,
        });
        if (c.useConst) {
          writer.addDeclaration([], comment(t)`export type {${t.name}};`);
        } else {
          writer.addDeclaration([], comment(t)`export {${t.name}};`);
        }
        if (checkEnumValues) {
          checkEnumValues({
            enumName: t.name,
            expectedValues: t.getValues().map((v) => v.name),
            importedName: c.importName ?? t.name,
            packageName: c.packageName,
            enumType: t,
          });
        }
      } else if (c.mode === EnumMode.StringLiterals) {
        writer.addDeclaration(
          [t.name],
          comment(t)`export type ${t.name} =\n${t
            .getValues()
            .map((t) => comment(t, `  `)`| ${JSON.stringify(t.name)}`)
            .join(`\n`)};`,
        );
        if (c.generateObjectMapping) {
          writer.addDeclaration(
            [],
            comment(t)`export const ${t.name} = {\n${t
              .getValues()
              .map(
                (t) => comment(t, `  `)`${t.name}: ${JSON.stringify(t.name)},`,
              )
              .join(`\n`)}\n} as const;`,
          );
        }
      } else {
        writer.addDeclaration(
          [t.name],
          comment(t)`export${c.useConst ? ` const` : ``} enum ${t.name} {\n${t
            .getValues()
            .map(
              (t) => comment(t, `  `)`${t.name} = ${JSON.stringify(t.name)},`,
            )
            .join(`\n`)}\n}`,
        );
      }
    }
  }
}

export function buildScalarDeclarations(
  schema: readonly GraphQLNamedType[],
  {
    writer,
    config,
  }: {
    writer: ITypeScriptWriter;
    config: ScalarConfig | ((s: GraphQLScalarType) => ScalarConfig);
  },
): void {
  for (const t of schema) {
    if (isScalarType(t) && !isBuiltinType(t.name)) {
      const c = typeof config === 'function' ? config(t) : config;
      if (c.mode === ScalarMode.InlineType) {
        writer.addDeclaration(
          [t.name],
          comment(t)`export type ${t.name} = ${c.type};`,
        );
      } else {
        writer.addImport({
          localName: t.name,
          importedName: c.importName ?? t.name,
          packageName: c.packageName,
          asType: true,
        });
        writer.addDeclaration([], comment(t)`export type {${t.name}};`);
      }
    }
  }
}

export function buildUnionDeclarations(
  schema: readonly GraphQLNamedType[],
  {writer}: {writer: ITypeScriptWriter},
): void {
  for (const t of schema) {
    if (isUnionType(t)) {
      writer.addDeclaration(
        [t.name],
        comment(t)`export type ${t.name} =\n${t
          .getTypes()
          .map((t) => `  | ${t.name}`)
          .join(`\n`)};`,
      );
    }
  }
}

export function buildInterfaceDeclarations(
  schema: readonly GraphQLNamedType[],
  {writer}: {writer: ITypeScriptWriter},
): void {
  for (const t of schema) {
    if (isInterfaceType(t)) {
      // We declare interfaces as Union types because we don't want resolvers
      // to return objects that are not one of the concrete types that implement
      // the interface
      writer.addDeclaration(
        [t.name],
        comment(t)`export type ${t.name} =\n${schema
          .filter(
            (t) =>
              isObjectType(t) &&
              t.getInterfaces().some((i) => i.name === t.name),
          )
          .map((t) => `  | ${t.name}`)
          .join(`\n`)};`,
      );
    }
  }
}

export function buildInputObjectDeclarations(
  schema: readonly GraphQLNamedType[],
  {writer, config}: {writer: ITypeScriptWriter; config: FieldTypeOptions},
): void {
  for (const t of schema) {
    if (isInputObjectType(t)) {
      writer.addDeclaration(
        [t.name],
        comment(t)`export interface ${t.name} {\n${Object.values(t.getFields())
          .map((f) => getField(`  `, f, config))
          .join(`\n`)}\n}`,
      );
    }
  }
}

export function buildObjectDeclarations(
  schema: readonly GraphQLNamedType[],
  {
    writer,
    excludeNames = ['Query', 'Mutation'],
    config,
  }: {
    writer: ITypeScriptWriter;
    excludeNames?: string[];
    config: ObjectConfig | ((s: GraphQLObjectType) => ObjectConfig);
  },
): void {
  for (const t of schema) {
    if (isObjectType(t) && !excludeNames.includes(t.name)) {
      const c = typeof config === 'function' ? config(t) : config;
      writer.addImport({
        localName: t.name,
        importedName: c.importName ?? t.name,
        packageName: c.packageName,
      });
      writer.addDeclaration([], comment(t)`export type {${t.name}};`);
    }
  }
}

export function getOutputType(
  type: GraphQLOutputType,
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
  args: readonly GraphQLArgument[],
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

const namedTypesCache = new WeakMap<
  GraphQLSchema,
  readonly GraphQLNamedType[]
>();
export function getNamedTypes(
  schema: GraphQLSchema,
): readonly GraphQLNamedType[] {
  const cached = namedTypesCache.get(schema);
  if (cached) return cached;
  const fresh = schema.toConfig().types.filter((t) => !t.name.startsWith('__'));
  namedTypesCache.set(schema, fresh);
  return fresh;
}

export interface GraphQLResolverObject {
  readonly name: string;
  readonly description: string;
  readonly fields: ReadonlyMap<string, GraphQLResolverField>;
}

export interface GraphQLResolverField {
  readonly name: string;
  readonly description: string;
  readonly args: readonly GraphQLArgument[];
  readonly type: GraphQLOutputType;
}

export function getResolverTypes(
  schema: readonly GraphQLNamedType[],
): ReadonlyMap<string, GraphQLResolverObject> {
  const objects = new Map<string, GraphQLResolverObject>();
  for (const t of schema) {
    if (isObjectType(t)) {
      const seenFields = new Set<string>();
      const fields = new Map<string, GraphQLResolverField>(
        [
          ...Object.values(t.getFields()),
          ...t
            .getInterfaces()
            .map((i) => Object.values(i.getFields()))
            .reduce((a, b) => [...a, ...b], []),
        ]
          .filter((f) => {
            if (seenFields.has(f.name)) return false;
            seenFields.add(f.name);
            return true;
          })
          .map((f) => [
            f.name,
            {
              name: f.name,
              description: f.description ?? ``,
              args: f.args,
              type: f.type,
            },
          ]),
      );
      objects.set(t.name, {
        name: t.name,
        description: t.description ?? ``,
        fields,
      });
    }
  }
  return objects;
}
