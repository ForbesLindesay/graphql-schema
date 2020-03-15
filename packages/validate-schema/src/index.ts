import {readFileSync} from 'fs';
import {relative} from 'path';
import {FEDERATION_SPEC_PREFIX} from '@graphql-schema/federation-spec';
import GraphQLError from '@graphql-schema/error';
import {GraphQLError as RawGraphQLError} from 'graphql/error';
import {parse, DocumentNode} from 'graphql/language';
import {validateSDL} from 'graphql/validation/validate';
import {codeFrameColumns} from '@babel/code-frame';
import chalk from 'chalk';

export interface Options {
  isFederated?: boolean;
  filename?: string;
}

export {GraphQLError};

export function validateSchemaFile(
  filename: string,
  options: Pick<Options, 'isFederated'> = {},
): {source: string; schema: DocumentNode} {
  let schemaString: string;
  try {
    schemaString = readFileSync(filename, 'utf8');
  } catch (ex) {
    if (ex.code === 'ENOENT') {
      throw new GraphQLError(
        'ENOENT',
        `${chalk.red(`Could not find the schema at`)} ${chalk.cyan(
          relative(process.cwd(), filename).replace(/\\/g, '/'),
        )}`,
        {filename},
      );
    }
    throw ex;
  }
  return validateSchema(schemaString, {
    ...options,
    filename: relative(process.cwd(), filename).replace(/\\/g, '/'),
  });
}
export default function validateSchema(
  schemaString: string,
  options: Options = {},
): {source: string; schema: DocumentNode} {
  let parsedSchema: DocumentNode;
  try {
    parsedSchema = parse(
      options.isFederated
        ? FEDERATION_SPEC_PREFIX + schemaString
        : schemaString,
    );
  } catch (ex) {
    throw new GraphQLError(
      'GRAPH_SYNTAX_ERROR',
      (options.filename
        ? `${chalk.red(`GraphQL syntax error in`)} ${chalk.cyan(
            options.filename,
          )}${chalk.red(`:`)}\n\n`
        : `${chalk.red(`GraphQL syntax error:`)}\n\n`) +
        formatError(ex, schemaString, options),
      {...options, source: schemaString, locations: ex.locations},
    );
  }

  if (options.isFederated) {
    // If we are looking at a federated schema, we may be extending
    // nodes that are declared in other schemas. We convert these
    // into ObjectTypeDefinitions before validation
    parsedSchema = {
      ...parsedSchema,
      definitions: parsedSchema.definitions.map((d) => {
        if (
          d.kind === 'ObjectTypeExtension' &&
          !parsedSchema.definitions.some(
            (d2) => d2.kind === 'ObjectTypeDefinition' && d2.name === d.name,
          )
        ) {
          return {...d, kind: 'ObjectTypeDefinition'};
        }
        return d;
      }),
    };
  }

  const errors = validateSDL(parsedSchema);
  if (errors.length) {
    throw new GraphQLError(
      'GRAPH_SCHEMA_ERROR',
      (options.filename
        ? `${chalk.red(
            `GraphQL schema ${errors.length > 1 ? 'errors' : 'error'} in`,
          )} ${chalk.cyan(options.filename)}${chalk.red(`:`)}\n\n`
        : chalk.red(
            `GraphQL schema ${errors.length > 1 ? 'errors' : 'error'}:\n\n`,
          )) +
        errors.map((e) => formatError(e, schemaString, options)).join('\n'),
      {...options, source: schemaString, errors},
    );
  }

  return {source: schemaString, schema: parse(schemaString)};
}

function formatError(
  e: RawGraphQLError | {message: string; locations: undefined},
  schemaString: string,
  {isFederated}: Options,
) {
  if (e.locations && e.locations.length === 1) {
    const [loc] = e.locations;
    return (
      e.message +
      '\n\n' +
      codeFrameColumns(schemaString, {
        start: {
          line:
            loc.line -
            (isFederated ? FEDERATION_SPEC_PREFIX.split('\n').length - 1 : 0),
          column: loc.column,
        },
      }) +
      '\n'
    );
  } else {
    return e.message;
  }
}
