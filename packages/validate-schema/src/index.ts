import {readFileSync} from 'fs';
import {relative} from 'path';

import type {GraphQLSchema} from 'graphql';
import {buildASTSchema} from 'graphql';
import type {GraphQLError as RawGraphQLError} from 'graphql/error';
import type {DocumentNode, DefinitionNode} from 'graphql/language';
import {parse} from 'graphql/language';
import {validateSDL} from 'graphql/validation/validate';

import type {types} from '@graphql-schema/document';
import GraphQlDocument, {
  errors,
  fromDocumentNode,
} from '@graphql-schema/document';
import {FEDERATION_SPEC_PREFIX} from '@graphql-schema/federation-spec';

export interface ValidateSchemaOptions {
  isFederated?: boolean;
  filename?: string;
}

export {GraphQlDocument};

export interface ValidateSchemaResult {
  source: string;
  document: GraphQlDocument;
  documentNode: DocumentNode;
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
      return errors.throwGraphQlError(
        'ENOENT',
        `Could not find the schema at ${filename}`,
        {
          loc: {kind: 'FileLocationSource', filename, source: ``},
        },
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
    return errors.throwGraphQlError('GRAPH_SYNTAX_ERROR', ex.message, {
      loc: getLocation(ex, {schemaString, filename: options.filename}),
    });
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

  const validationErrors = validateSDL(schemaToValidate);
  if (validationErrors.length) {
    return errors.throwGraphQlError(
      `GRAPHQL_SCHEMA_ERROR`,
      validationErrors[0].message,
      {
        loc: getLocation(validationErrors[0], {
          schemaString,
          filename: options.filename,
        }),
        errors:
          validationErrors.length > 1
            ? validationErrors.map((err) =>
                errors.createGraphQlError(`GRAPHQL_SCHEMA_ERROR`, err.message, {
                  loc: getLocation(err, {
                    schemaString,
                    filename: options.filename,
                  }),
                }),
              )
            : [],
      },
    );
  }

  return {
    source: schemaString,
    document: fromDocumentNode(parsedSchema, {
      referencedDocuments: [],
      source: options.filename
        ? {
            kind: 'FileLocationSource',
            filename: options.filename,
            source: schemaString,
          }
        : {kind: 'StringLocationSource', source: schemaString},
    }),
    documentNode: parsedSchema,
    schema: buildASTSchema(parsedSchema, {
      assumeValid: true,
      assumeValidSDL: true,
    }),
  };
}

function getLocation(
  e: RawGraphQLError | {message: string; locations: undefined},
  {
    schemaString,
    filename,
  }: {schemaString: string; filename: string | undefined},
): types.Location {
  const source: types.LocationSource = filename
    ? {kind: 'FileLocationSource', filename, source: schemaString}
    : {kind: 'StringLocationSource', source: schemaString};

  if (e.locations && e.locations.length === 1) {
    const [loc] = e.locations;
    const position = errors.lineAndColumnToIndex(schemaString, loc);
    if (position) return {kind: 'LocationRange', source, start: position};
  }

  return source;
}
