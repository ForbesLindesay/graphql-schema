import {readFileSync} from 'fs';
import {relative} from 'path';
import {FEDERATION_SPEC_PREFIX} from '@graphql-schema/federation-spec';
import GraphQLError from '@graphql-schema/error';
import {GraphQLError as RawGraphQLError} from 'graphql/error';
import {parse, DocumentNode, DefinitionNode} from 'graphql/language';
import {validateSDL} from 'graphql/validation/validate';
import {codeFrameColumns} from '@babel/code-frame';
import chalk from 'chalk';
import {buildASTSchema, GraphQLSchema} from 'graphql';

export interface ValidateSchemaOptions {
  isFederated?: boolean;
  filename?: string;
}

export {GraphQLError};

export interface ValidateSchemaResult {
  source: string;
  document: DocumentNode;
  schema: GraphQLSchema;
}

export function validateSchemaFile(
  filename: string,
  options: Pick<ValidateSchemaOptions, 'isFederated'> = {},
): ValidateSchemaResult {
  let schemaString: string;
  try {
    schemaString = readFileSync(filename, 'utf8');
  } catch (ex: any) {
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
  options: ValidateSchemaOptions = {},
): ValidateSchemaResult {
  let parsedSchema: DocumentNode;
  try {
    parsedSchema = parse(schemaString);
  } catch (ex: any) {
    throw new GraphQLError(
      'GRAPH_SYNTAX_ERROR',
      (options.filename
        ? `${chalk.red(`GraphQL syntax error in`)} ${chalk.cyan(
            options.filename,
          )}${chalk.red(`:`)}\n\n`
        : `${chalk.red(`GraphQL syntax error:`)}\n\n`) +
        formatError(ex, schemaString),
      {...options, source: schemaString, locations: ex.locations},
    );
  }

  // If we are looking at a federated schema, we may be extending
  // nodes that are declared in other schemas. We convert these
  // into ObjectTypeDefinitions before validation
  const schemaToValidate = options.isFederated
    ? {
        ...parsedSchema,
        definitions: [
          ...parse(FEDERATION_SPEC_PREFIX).definitions,
          ...parsedSchema.definitions.map(
            (d): DefinitionNode => {
              if (
                d.kind === 'ObjectTypeExtension' &&
                !parsedSchema.definitions.some(
                  (d2) =>
                    d2.kind === 'ObjectTypeDefinition' && d2.name === d.name,
                )
              ) {
                return {...d, kind: 'ObjectTypeDefinition'};
              }
              return d;
            },
          ),
        ],
      }
    : parsedSchema;

  const errors = validateSDL(schemaToValidate);
  if (errors.length) {
    throw new GraphQLError(
      'GRAPH_SCHEMA_ERROR',
      (options.filename
        ? `${chalk.red(
            `GraphQL schema ${errors.length > 1 ? 'errors' : 'error'} in`,
          )} ${chalk.cyan(options.filename)}${chalk.red(`:`)}\n\n`
        : chalk.red(
            `GraphQL schema ${errors.length > 1 ? 'errors' : 'error'}:\n\n`,
          )) + errors.map((e) => formatError(e, schemaString)).join('\n'),
      {...options, source: schemaString, errors},
    );
  }

  return {
    source: schemaString,
    document: parsedSchema,
    schema: buildASTSchema(parsedSchema, {
      assumeValid: true,
      assumeValidSDL: true,
    }),
  };
}

function formatError(
  e: RawGraphQLError | {message: string; locations: undefined},
  schemaString: string,
) {
  if (e.locations && e.locations.length === 1) {
    const [loc] = e.locations;
    return (
      e.message +
      '\n\n' +
      codeFrameColumns(schemaString, {
        start: {
          line: loc.line,
          column: loc.column,
        },
      }) +
      '\n'
    );
  } else {
    return e.message;
  }
}
