import {
  ScalarMode,
  ScalarConfig,
} from '@graphql-schema/build-typescript-declarations';
import {GraphQLError} from '@graphql-schema/validate-schema';
import * as ft from 'funtypes';
import {GraphQLScalarType} from 'graphql';

export const ScalarConfigInlineTypeSchema = ft.Named(
  `ScalarConfigInlineType`,
  ft.Object({
    mode: ft.Literal(ScalarMode.InlineType),
    type: ft.String,
  }),
);

export const ScalarConfigTypeImportSchema = ft.Named(
  `ScalarConfigTypeImport`,
  ft.Object({
    mode: ft.Literal(ScalarMode.TypeImport),
    packageName: ft.String,
    importName: ft.Union(ft.Undefined, ft.String),
  }),
);

export const ScalarConfigByNameSchema = ft.Named(
  `ScalarConfigByName`,
  ft.Object({
    mode: ft.Literal('BY_SCALAR_NAME'),
    scalars: ft.Record(
      ft.String,
      ft.Union(ScalarConfigInlineTypeSchema, ScalarConfigTypeImportSchema),
    ),
  }),
);

export const ScalarConfigSchema: ft.Runtype<
  ScalarConfig | ((e: GraphQLScalarType) => ScalarConfig)
> = ft
  .Union(
    ScalarConfigInlineTypeSchema,
    ScalarConfigTypeImportSchema,
    ScalarConfigByNameSchema,
  )
  .withParser({
    name: 'ScalarConfig',
    parse: (
      config,
    ): ft.Result<ScalarConfig | ((e: GraphQLScalarType) => ScalarConfig)> =>
      config.mode === 'BY_SCALAR_NAME'
        ? {
            success: true,
            value: (e: GraphQLScalarType) => {
              const c = config.scalars[e.name];
              if (c !== undefined) {
                return c;
              } else {
                throw new GraphQLError(
                  `MISSING_Scalar`,
                  `Your GraphQL schema includes an scalar called "${e.name}" but that scalar does not exist in your config.`,
                );
              }
            },
          }
        : {success: true, value: config},
  });
