import {
  ObjectMode,
  ObjectConfig,
} from '@graphql-schema/build-typescript-declarations';
import {types, errors} from '@graphql-schema/document';
import * as ft from 'funtypes';

export const ObjectConfigTypeImportSchema = ft.Named(
  `ObjectConfigTypeImport`,
  ft.Object({
    mode: ft.Literal(ObjectMode.TypeImport),
    packageName: ft.String,
    importName: ft.Union(ft.String, ft.Undefined),
  }),
);

export const ObjectConfigByNameSchema = ft.Named(
  `ObjectConfigByName`,
  ft.Object({
    mode: ft.Literal('BY_OBJECT_NAME'),
    objects: ft.Record(ft.String, ObjectConfigTypeImportSchema),
  }),
);

export const ObjectConfigSchema: ft.Runtype<
  ObjectConfig | ((e: types.ObjectTypeDefinitionNode) => ObjectConfig)
> = ft
  .Union(ObjectConfigTypeImportSchema, ObjectConfigByNameSchema)
  .withParser({
    name: 'ObjectConfig',
    parse: (
      config,
    ): ft.Result<
      ObjectConfig | ((e: types.ObjectTypeDefinitionNode) => ObjectConfig)
    > =>
      config.mode === 'BY_OBJECT_NAME'
        ? {
            success: true,
            value: (e: types.ObjectTypeDefinitionNode) => {
              const c = config.objects[e.name.value];
              if (c !== undefined) {
                return c;
              } else {
                errors.throwGraphQlError(
                  `MISSING_OBJECT`,
                  `Your GraphQL schema includes an object called "${e.name.value}" but that object does not exist in your config.`,
                  {loc: e.name.loc},
                );
              }
            },
          }
        : {success: true, value: config},
  });
