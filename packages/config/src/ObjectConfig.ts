import {
  ObjectMode,
  ObjectConfig,
} from '@graphql-schema/build-typescript-declarations';
import {GraphQLError} from '@graphql-schema/validate-schema';
import * as ft from 'funtypes';
import {GraphQLObjectType} from 'graphql';

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
  ObjectConfig | ((e: GraphQLObjectType) => ObjectConfig)
> = ft
  .Union(ObjectConfigTypeImportSchema, ObjectConfigByNameSchema)
  .withParser({
    name: 'ObjectConfig',
    parse: (
      config,
    ): ft.Result<ObjectConfig | ((e: GraphQLObjectType) => ObjectConfig)> =>
      config.mode === 'BY_OBJECT_NAME'
        ? {
            success: true,
            value: (e: GraphQLObjectType) => {
              const c = config.objects[e.name];
              if (c !== undefined) {
                return c;
              } else {
                throw new GraphQLError(
                  `MISSING_OBJECT`,
                  `Your GraphQL schema includes an object called "${e.name}" but that object does not exist in your config.`,
                );
              }
            },
          }
        : {success: true, value: config},
  });
