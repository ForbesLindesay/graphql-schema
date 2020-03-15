import {validateSchemaFile} from '../';

function expectError(filename: string, isFederated: boolean, code: string) {
  try {
    validateSchemaFile(filename, {isFederated});
  } catch (ex) {
    expect(ex.code).toBe(code);
    return expect(require('strip-ansi')(ex.message));
  }
  throw new Error('Expected validateSchema to throw');
}

test('non-existant.graphql', () => {
  expectError(
    __dirname + '/non-existant.graphql',
    false,
    'ENOENT',
  ).toMatchInlineSnapshot(
    `"Could not find the schema at packages/validate-schema/src/__tests__/non-existant.graphql"`,
  );
});

test('invalid-schema.graphql', () => {
  expectError(
    __dirname + '/invalid-schema.graphql',
    false,
    'GRAPH_SCHEMA_ERROR',
  ).toMatchInlineSnapshot(`
"GraphQL schema errors in packages/validate-schema/src/__tests__/invalid-schema.graphql:

Unknown type \\"Trimmed\\". Did you mean \\"TrimmedString\\"?

   6 | 
   7 | input ContactInput {
>  8 |   name: Trimmed!
     |         ^
   9 | }
  10 | 
  11 | type Query {

Unknown type \\"Cont\\". Did you mean \\"Int\\" or \\"Contact\\"?

  14 | 
  15 | type Mutation {
> 16 |   createContact(contact: ContactInput!): Cont
     |                                          ^
  17 | }
  18 | 
"
`);
});

test('invalid-schema-2.graphql', () => {
  expectError(
    __dirname + '/invalid-schema-2.graphql',
    false,
    'GRAPH_SYNTAX_ERROR',
  ).toMatchInlineSnapshot(`
"GraphQL syntax error in packages/validate-schema/src/__tests__/invalid-schema-2.graphql:

Syntax Error: Unexpected Name \\"typ\\"

> 1 | typ Contact {
    | ^
  2 |   name: String!
  3 | }
  4 | typ Query {
"
`);
});

test('invalid-federated-schema.graphql', () => {
  expectError(
    __dirname + '/invalid-federated-schema.graphql',
    true,
    'GRAPH_SCHEMA_ERROR',
  ).toMatchInlineSnapshot(`
"GraphQL schema error in packages/validate-schema/src/__tests__/invalid-federated-schema.graphql:

Unknown type \\"Integer\\".

  1 | extend type User @key(fields: \\"id\\") {
  2 |   id: ID! @external
> 3 |   numberOfFriends: Integer
    |                    ^
  4 | }
  5 | 
"
`);
});

test('invalid-federated-schema-2.graphql', () => {
  expectError(
    __dirname + '/invalid-federated-schema-2.graphql',
    true,
    'GRAPH_SYNTAX_ERROR',
  ).toMatchInlineSnapshot(`
"GraphQL syntax error in packages/validate-schema/src/__tests__/invalid-federated-schema-2.graphql:

Syntax Error: Expected :, found Name \\"Int\\"

  1 | extend type User @key(fields: \\"id\\") {
  2 |   id: ID! @external
> 3 |   numberOfFriends Int
    |                   ^
  4 | }
  5 | 
"
`);
});

test('valid-schema.graphql', () => {
  expect(
    JSON.parse(
      JSON.stringify(
        validateSchemaFile(__dirname + '/valid-schema.graphql'),
        (key, value) => (key === 'loc' ? undefined : value),
      ),
    ),
  ).toMatchInlineSnapshot(`
Object {
  "schema": Object {
    "definitions": Array [
      Object {
        "directives": Array [],
        "kind": "ScalarTypeDefinition",
        "name": Object {
          "kind": "Name",
          "value": "TrimmedString",
        },
      },
      Object {
        "directives": Array [],
        "fields": Array [
          Object {
            "arguments": Array [],
            "directives": Array [],
            "kind": "FieldDefinition",
            "name": Object {
              "kind": "Name",
              "value": "name",
            },
            "type": Object {
              "kind": "NonNullType",
              "type": Object {
                "kind": "NamedType",
                "name": Object {
                  "kind": "Name",
                  "value": "TrimmedString",
                },
              },
            },
          },
        ],
        "interfaces": Array [],
        "kind": "ObjectTypeDefinition",
        "name": Object {
          "kind": "Name",
          "value": "Contact",
        },
      },
      Object {
        "directives": Array [],
        "fields": Array [
          Object {
            "directives": Array [],
            "kind": "InputValueDefinition",
            "name": Object {
              "kind": "Name",
              "value": "name",
            },
            "type": Object {
              "kind": "NonNullType",
              "type": Object {
                "kind": "NamedType",
                "name": Object {
                  "kind": "Name",
                  "value": "TrimmedString",
                },
              },
            },
          },
        ],
        "kind": "InputObjectTypeDefinition",
        "name": Object {
          "kind": "Name",
          "value": "ContactInput",
        },
      },
      Object {
        "directives": Array [],
        "fields": Array [
          Object {
            "arguments": Array [],
            "directives": Array [],
            "kind": "FieldDefinition",
            "name": Object {
              "kind": "Name",
              "value": "contacts",
            },
            "type": Object {
              "kind": "NonNullType",
              "type": Object {
                "kind": "ListType",
                "type": Object {
                  "kind": "NonNullType",
                  "type": Object {
                    "kind": "NamedType",
                    "name": Object {
                      "kind": "Name",
                      "value": "Contact",
                    },
                  },
                },
              },
            },
          },
        ],
        "interfaces": Array [],
        "kind": "ObjectTypeDefinition",
        "name": Object {
          "kind": "Name",
          "value": "Query",
        },
      },
      Object {
        "directives": Array [],
        "fields": Array [
          Object {
            "arguments": Array [
              Object {
                "directives": Array [],
                "kind": "InputValueDefinition",
                "name": Object {
                  "kind": "Name",
                  "value": "contact",
                },
                "type": Object {
                  "kind": "NonNullType",
                  "type": Object {
                    "kind": "NamedType",
                    "name": Object {
                      "kind": "Name",
                      "value": "ContactInput",
                    },
                  },
                },
              },
            ],
            "directives": Array [],
            "kind": "FieldDefinition",
            "name": Object {
              "kind": "Name",
              "value": "createContact",
            },
            "type": Object {
              "kind": "NamedType",
              "name": Object {
                "kind": "Name",
                "value": "Contact",
              },
            },
          },
        ],
        "interfaces": Array [],
        "kind": "ObjectTypeDefinition",
        "name": Object {
          "kind": "Name",
          "value": "Mutation",
        },
      },
    ],
    "kind": "Document",
  },
  "source": "scalar TrimmedString

type Contact {
  name: TrimmedString!
}

input ContactInput {
  name: TrimmedString!
}

type Query {
  contacts: [Contact!]!
}

type Mutation {
  createContact(contact: ContactInput!): Contact
}
",
}
`);
});

test('valid-federated-schema.graphql', () => {
  expect(
    JSON.parse(
      JSON.stringify(
        validateSchemaFile(__dirname + '/valid-federated-schema.graphql', {
          isFederated: true,
        }),
        (key, value) => (key === 'loc' ? undefined : value),
      ),
    ),
  ).toMatchInlineSnapshot(`
Object {
  "schema": Object {
    "definitions": Array [
      Object {
        "directives": Array [
          Object {
            "arguments": Array [
              Object {
                "kind": "Argument",
                "name": Object {
                  "kind": "Name",
                  "value": "fields",
                },
                "value": Object {
                  "block": false,
                  "kind": "StringValue",
                  "value": "id",
                },
              },
            ],
            "kind": "Directive",
            "name": Object {
              "kind": "Name",
              "value": "key",
            },
          },
        ],
        "fields": Array [
          Object {
            "arguments": Array [],
            "directives": Array [
              Object {
                "arguments": Array [],
                "kind": "Directive",
                "name": Object {
                  "kind": "Name",
                  "value": "external",
                },
              },
            ],
            "kind": "FieldDefinition",
            "name": Object {
              "kind": "Name",
              "value": "id",
            },
            "type": Object {
              "kind": "NonNullType",
              "type": Object {
                "kind": "NamedType",
                "name": Object {
                  "kind": "Name",
                  "value": "ID",
                },
              },
            },
          },
          Object {
            "arguments": Array [],
            "directives": Array [],
            "kind": "FieldDefinition",
            "name": Object {
              "kind": "Name",
              "value": "numberOfFriends",
            },
            "type": Object {
              "kind": "NamedType",
              "name": Object {
                "kind": "Name",
                "value": "Int",
              },
            },
          },
        ],
        "interfaces": Array [],
        "kind": "ObjectTypeExtension",
        "name": Object {
          "kind": "Name",
          "value": "User",
        },
      },
    ],
    "kind": "Document",
  },
  "source": "extend type User @key(fields: \\"id\\") {
  id: ID! @external
  numberOfFriends: Int
}
",
}
`);
});
