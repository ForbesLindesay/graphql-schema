import {
  EnumMode,
  EnumConfig,
} from '@graphql-schema/build-typescript-declarations';
import {types, errors} from '@graphql-schema/document';
import * as ft from 'funtypes';

export const EnumConfigStringLiteralsSchema = ft.Named(
  `EnumConfigStringLiterals`,
  ft.Object({
    mode: ft.Literal(EnumMode.StringLiterals),
    generateObjectMapping: ft.Union(ft.Undefined, ft.Boolean),
  }),
);

export const EnumConfigEnumDeclarationSchema = ft.Named(
  `EnumConfigEnumDeclaration`,
  ft.Object({
    mode: ft.Literal(EnumMode.EnumDeclaration),
    useConst: ft.Union(ft.Undefined, ft.Boolean),
  }),
);

export const EnumConfigEnumImportSchema = ft.Named(
  `EnumConfigEnumImport`,
  ft.Object({
    mode: ft.Literal(EnumMode.EnumImport),
    packageName: ft.String,
    useConst: ft.Union(ft.Undefined, ft.Boolean),
    importName: ft.Union(ft.Undefined, ft.String),
  }),
);

export const EnumConfigByNameSchema = ft.Named(
  `EnumConfigByName`,
  ft.Object({
    mode: ft.Literal('BY_ENUM_NAME'),
    enums: ft.Record(
      ft.String,
      ft.Union(
        EnumConfigStringLiteralsSchema,
        EnumConfigEnumDeclarationSchema,
        EnumConfigEnumImportSchema,
      ),
    ),
  }),
);

export const EnumConfigSchema: ft.Runtype<
  EnumConfig | ((e: types.EnumTypeDefinitionNode) => EnumConfig)
> = ft
  .Union(
    EnumConfigStringLiteralsSchema,
    EnumConfigEnumDeclarationSchema,
    EnumConfigEnumImportSchema,
    EnumConfigByNameSchema,
  )
  .withParser({
    name: 'EnumConfig',
    parse: (
      config,
    ): ft.Result<
      EnumConfig | ((e: types.EnumTypeDefinitionNode) => EnumConfig)
    > =>
      config.mode === 'BY_ENUM_NAME'
        ? {
            success: true,
            value: (e: types.EnumTypeDefinitionNode) => {
              const c = config.enums[e.name.value];
              if (c !== undefined) {
                return c;
              } else {
                errors.throwGraphQlError(
                  `MISSING_ENUM`,
                  `Your GraphQL schema includes an enum called "${e.name.value}" but that enum does not exist in your config.`,
                  {loc: e.name.loc},
                );
              }
            },
          }
        : {success: true, value: config},
  });
