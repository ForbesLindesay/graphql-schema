import {
  ScalarMode,
  ScalarConfig,
} from '@graphql-schema/build-typescript-declarations';
import {types, errors} from '@graphql-schema/document';
import * as ft from 'funtypes';

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
  ScalarConfig | ((e: types.ScalarTypeDefinitionNode) => ScalarConfig)
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
    ): ft.Result<
      ScalarConfig | ((e: types.ScalarTypeDefinitionNode) => ScalarConfig)
    > =>
      config.mode === 'BY_SCALAR_NAME'
        ? {
            success: true,
            value: (e: types.ScalarTypeDefinitionNode) => {
              const c = config.scalars[e.name.value];
              if (c !== undefined) {
                return c;
              } else {
                errors.throwGraphQlError(
                  `MISSING_Scalar`,
                  `Your GraphQL schema includes an scalar called "${e.name.value}" but that scalar does not exist in your config.`,
                  {loc: e.name.loc},
                );
              }
            },
          }
        : {success: true, value: config},
  });
