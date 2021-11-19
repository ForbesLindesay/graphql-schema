import {
  EnumMode,
  EnumConfig,
} from '@graphql-schema/build-typescript-declarations';
import {GraphQLError} from '@graphql-schema/validate-schema';
import * as ft from 'funtypes';
import {GraphQLEnumType} from 'graphql';

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
  EnumConfig | ((e: GraphQLEnumType) => EnumConfig)
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
    ): ft.Result<EnumConfig | ((e: GraphQLEnumType) => EnumConfig)> =>
      config.mode === 'BY_ENUM_NAME'
        ? {
            success: true,
            value: (e: GraphQLEnumType) => {
              const c = config.enums[e.name];
              if (c !== undefined) {
                return c;
              } else {
                throw new GraphQLError(
                  `MISSING_ENUM`,
                  `Your GraphQL schema includes an enum called "${e.name}" but that enum does not exist in your config.`,
                );
              }
            },
          }
        : {success: true, value: config},
  });
