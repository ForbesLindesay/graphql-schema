import {extname, relative} from 'path';
import chalk from 'chalk';
import {readFileSync} from 'fs';
import * as ft from 'funtypes';
import * as jsonc from 'jsonc-parser';
import {EnumConfigSchema} from './EnumConfig';
import {ScalarConfigSchema} from './ScalarConfig';
import {InputObjectConfigSchema} from './InputObjectConfig';
import {ObjectConfigSchema} from './ObjectConfig';
import {ScalarResolversConfigSchema} from './ScalarResolversConfig';
import {ObjectResolversConfigSchema} from './ObjectResolversConfig';
import {SchemaSourceSchema} from './SchemaSource';

export {
  SchemaSourceSchema,
  // declarations
  EnumConfigSchema,
  ScalarConfigSchema,
  InputObjectConfigSchema,
  ObjectConfigSchema,
  // resolvers
  ScalarResolversConfigSchema,
  ObjectResolversConfigSchema,
};

export const ResolverTypesConfigSchema = ft.Object({
  schema: SchemaSourceSchema,
  resolverTypes: ft.Object({
    filename: ft.String,

    // declarations
    enums: EnumConfigSchema,
    scalars: ScalarConfigSchema,
    inputObjects: InputObjectConfigSchema,
    objects: ObjectConfigSchema,

    // resolvers
    scalarResolvers: ScalarResolversConfigSchema,
    objectResolvers: ObjectResolversConfigSchema,
  }),
  schemaOutput: ft.Union(
    ft.Undefined,
    ft.Object({
      filename: ft.String,
      template: ft.String,
    }),
  ),
  operations: ft.Union(
    ft.Undefined,
    ft.Array(
      ft.Object({
        filename: ft.String,
        output: ft.Object({
          filename: ft.String,

          // declarations
          enums: EnumConfigSchema,
          scalars: ScalarConfigSchema,
          inputObjects: InputObjectConfigSchema,
        }),
      }),
    ),
  ),
});
export type ResolverTypesConfig = ft.Static<typeof ResolverTypesConfigSchema>;

export default function readConfigFile<T>(
  filename: string,
  codec: ft.Runtype<T>,
) {
  const parser = getParser(filename);
  const str = readConfigFileToString(filename);
  const result = codec.safeParse(parser(str));
  if (result.success) {
    return result.value;
  }

  throw new Error(
    `The config file had validation errors in ${relative(
      process.cwd(),
      filename,
    ).replace(/\\/g, '/')}\n\n${ft.showError(result)}`,
  );
  // throw new GraphQLError(
  //   'ENOENT',
  //   `${chalk.red(`The config file had validation errors at`)} ${chalk.cyan(
  //     relative(process.cwd(), filename).replace(/\\/g, '/'),
  //   )}\n\n${ft.showError(result)}`,
  //   {filename},
  // );
}

function readConfigFileToString(filename: string) {
  try {
    return readFileSync(filename, 'utf8');
  } catch (ex: any) {
    // if (ex.code === 'ENOENT') {
    //   throw new GraphQLError(
    //     'ENOENT',
    //     `${chalk.red(`Could not find the config file at`)} ${chalk.cyan(
    //       relative(process.cwd(), filename).replace(/\\/g, '/'),
    //     )}`,
    //     {filename},
    //   );
    // }
    throw ex;
  }
}

function getParser(filename: string): (str: string) => unknown {
  switch (extname(filename)) {
    case '.json':
      return (str) => {
        // try {
        const errors: jsonc.ParseError[] = [];
        const result = jsonc.parse(str, errors, {allowTrailingComma: true});
        if (errors.length) {
          // throw new GraphQLError(
          //   'INVALID_JSON',
          //   `${chalk.red(`Could not parse the JSON in`)} ${chalk.cyan(
          //     relative(process.cwd(), filename).replace(/\\/g, '/'),
          //   )}. ${jsonc.printParseErrorCode(errors[0].error)} on line ${
          //     str.substr(0, errors[0].offset).split(`\n`).length
          //   }`,
          //   {filename},
          // );
          throw new Error(
            `Could not parse the JSON in ${relative(
              process.cwd(),
              filename,
            ).replace(/\\/g, '/')}. ${jsonc.printParseErrorCode(
              errors[0].error,
            )} on line ${str.substr(0, errors[0].offset).split(`\n`).length}`,
          );
        }
        return result;
        // } catch (ex: any) {
        //   if (ex instanceof GraphQLError) {
        //     throw ex;
        //   }
        //   throw new GraphQLError(
        //     'INVALID_JSON',
        //     `${chalk.red(`Could not parse the JSON in`)} ${chalk.cyan(
        //       relative(process.cwd(), filename).replace(/\\/g, '/'),
        //     )}: ${ex.message}`,
        //     {filename},
        //   );
        // }
      };
    default:
      throw new Error(
        // 'INVALID_CONFIG_FORMAT',
        `${chalk.red(`Unsupported config file format`)} ${chalk.cyan(
          relative(process.cwd(), filename).replace(/\\/g, '/'),
        )}. ${chalk.red(`Expected the file extension to be ".json"`)}`,
        // {filename},
      );
  }
}
