import {validateSchemaFile} from '..';

function expectError(filename: string, isFederated: boolean, code: string) {
  try {
    validateSchemaFile(filename, {isFederated});
  } catch (ex: any) {
    expect(ex.code).toBe(code);
    return expect(ex.message);
  }
  throw new Error('Expected validateSchema to throw');
}

test('non-existant.graphql', () => {
  expectError(
    __dirname + '/non-existant.graphql',
    false,
    'ENOENT',
  ).toMatchInlineSnapshot(
    `"packages/validate-schema/src/__tests__/non-existant.graphql: Could not find the schema at packages/validate-schema/src/__tests__/non-existant.graphql"`,
  );
});

test('invalid-schema.graphql', () => {
  expectError(
    __dirname + '/invalid-schema.graphql',
    false,
    'GRAPHQL_SCHEMA_ERROR',
  ).toMatchInlineSnapshot(
    `"packages/validate-schema/src/__tests__/invalid-schema.graphql (1:102): Unknown type \\"Trimmed\\". Did you mean \\"TrimmedString\\"?"`,
  );
});

test('invalid-schema-2.graphql', () => {
  expectError(
    __dirname + '/invalid-schema-2.graphql',
    false,
    'GRAPH_SYNTAX_ERROR',
  ).toMatchInlineSnapshot(
    `"packages/validate-schema/src/__tests__/invalid-schema-2.graphql (1:14): Syntax Error: Unexpected Name \\"typ\\""`,
  );
});

test('invalid-federated-schema.graphql', () => {
  expectError(
    __dirname + '/invalid-federated-schema.graphql',
    true,
    'GRAPHQL_SCHEMA_ERROR',
  ).toMatchInlineSnapshot(
    `"packages/validate-schema/src/__tests__/invalid-federated-schema.graphql (1:102): Unknown type \\"Integer\\"."`,
  );
});

test('invalid-federated-schema-2.graphql', () => {
  expectError(
    __dirname + '/invalid-federated-schema-2.graphql',
    true,
    'GRAPH_SYNTAX_ERROR',
  ).toMatchInlineSnapshot(
    `"packages/validate-schema/src/__tests__/invalid-federated-schema-2.graphql (1:96): Syntax Error: Expected :, found Name \\"Int\\""`,
  );
});

test('valid-schema.graphql', () => {
  const {schema} = validateSchemaFile(__dirname + '/valid-schema.graphql');
  expect(
    schema
      .toConfig()
      .types.map((t) => t.name)
      .sort(),
  ).toEqual([
    'Boolean',
    'Contact',
    'ContactInput',
    'Mutation',
    'Query',
    'String',
    'TrimmedString',
    '__Directive',
    '__DirectiveLocation',
    '__EnumValue',
    '__Field',
    '__InputValue',
    '__Schema',
    '__Type',
    '__TypeKind',
  ]);
});

test('valid-federated-schema.graphql', () => {
  const {schema} = validateSchemaFile(
    __dirname + '/valid-federated-schema.graphql',
    {
      isFederated: true,
    },
  );
  expect(
    schema
      .toConfig()
      .types.map((t) => t.name)
      .sort(),
  ).toEqual([
    'Boolean',
    'String',
    '__Directive',
    '__DirectiveLocation',
    '__EnumValue',
    '__Field',
    '__InputValue',
    '__Schema',
    '__Type',
    '__TypeKind',
  ]);
});
