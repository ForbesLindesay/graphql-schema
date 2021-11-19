import {validateSchemaFile} from '../';

function expectError(filename: string, isFederated: boolean, code: string) {
  try {
    validateSchemaFile(filename, {isFederated});
  } catch (ex: any) {
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
  const {document, source, schema} = validateSchemaFile(
    __dirname + '/valid-schema.graphql',
  );
  expect(
    schema
      .toConfig()
      .types.map((t) => t.name)
      .sort(),
  ).toMatchInlineSnapshot(`
Array [
  "Boolean",
  "Contact",
  "ContactInput",
  "Mutation",
  "Query",
  "String",
  "TrimmedString",
  "__Directive",
  "__DirectiveLocation",
  "__EnumValue",
  "__Field",
  "__InputValue",
  "__Schema",
  "__Type",
  "__TypeKind",
]
`);
  expect(JSON.parse(JSON.stringify({document, source}))).toMatchInlineSnapshot(`
Object {
  "document": Object {
    "definitions": Array [
      Object {
        "directives": Array [],
        "kind": "ScalarTypeDefinition",
        "loc": Object {
          "end": 20,
          "start": 0,
        },
        "name": Object {
          "kind": "Name",
          "loc": Object {
            "end": 20,
            "start": 7,
          },
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
            "loc": Object {
              "end": 59,
              "start": 39,
            },
            "name": Object {
              "kind": "Name",
              "loc": Object {
                "end": 43,
                "start": 39,
              },
              "value": "name",
            },
            "type": Object {
              "kind": "NonNullType",
              "loc": Object {
                "end": 59,
                "start": 45,
              },
              "type": Object {
                "kind": "NamedType",
                "loc": Object {
                  "end": 58,
                  "start": 45,
                },
                "name": Object {
                  "kind": "Name",
                  "loc": Object {
                    "end": 58,
                    "start": 45,
                  },
                  "value": "TrimmedString",
                },
              },
            },
          },
        ],
        "interfaces": Array [],
        "kind": "ObjectTypeDefinition",
        "loc": Object {
          "end": 61,
          "start": 22,
        },
        "name": Object {
          "kind": "Name",
          "loc": Object {
            "end": 34,
            "start": 27,
          },
          "value": "Contact",
        },
      },
      Object {
        "directives": Array [],
        "fields": Array [
          Object {
            "directives": Array [],
            "kind": "InputValueDefinition",
            "loc": Object {
              "end": 106,
              "start": 86,
            },
            "name": Object {
              "kind": "Name",
              "loc": Object {
                "end": 90,
                "start": 86,
              },
              "value": "name",
            },
            "type": Object {
              "kind": "NonNullType",
              "loc": Object {
                "end": 106,
                "start": 92,
              },
              "type": Object {
                "kind": "NamedType",
                "loc": Object {
                  "end": 105,
                  "start": 92,
                },
                "name": Object {
                  "kind": "Name",
                  "loc": Object {
                    "end": 105,
                    "start": 92,
                  },
                  "value": "TrimmedString",
                },
              },
            },
          },
        ],
        "kind": "InputObjectTypeDefinition",
        "loc": Object {
          "end": 108,
          "start": 63,
        },
        "name": Object {
          "kind": "Name",
          "loc": Object {
            "end": 81,
            "start": 69,
          },
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
            "loc": Object {
              "end": 146,
              "start": 125,
            },
            "name": Object {
              "kind": "Name",
              "loc": Object {
                "end": 133,
                "start": 125,
              },
              "value": "contacts",
            },
            "type": Object {
              "kind": "NonNullType",
              "loc": Object {
                "end": 146,
                "start": 135,
              },
              "type": Object {
                "kind": "ListType",
                "loc": Object {
                  "end": 145,
                  "start": 135,
                },
                "type": Object {
                  "kind": "NonNullType",
                  "loc": Object {
                    "end": 144,
                    "start": 136,
                  },
                  "type": Object {
                    "kind": "NamedType",
                    "loc": Object {
                      "end": 143,
                      "start": 136,
                    },
                    "name": Object {
                      "kind": "Name",
                      "loc": Object {
                        "end": 143,
                        "start": 136,
                      },
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
        "loc": Object {
          "end": 148,
          "start": 110,
        },
        "name": Object {
          "kind": "Name",
          "loc": Object {
            "end": 120,
            "start": 115,
          },
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
                "loc": Object {
                  "end": 204,
                  "start": 182,
                },
                "name": Object {
                  "kind": "Name",
                  "loc": Object {
                    "end": 189,
                    "start": 182,
                  },
                  "value": "contact",
                },
                "type": Object {
                  "kind": "NonNullType",
                  "loc": Object {
                    "end": 204,
                    "start": 191,
                  },
                  "type": Object {
                    "kind": "NamedType",
                    "loc": Object {
                      "end": 203,
                      "start": 191,
                    },
                    "name": Object {
                      "kind": "Name",
                      "loc": Object {
                        "end": 203,
                        "start": 191,
                      },
                      "value": "ContactInput",
                    },
                  },
                },
              },
            ],
            "directives": Array [],
            "kind": "FieldDefinition",
            "loc": Object {
              "end": 214,
              "start": 168,
            },
            "name": Object {
              "kind": "Name",
              "loc": Object {
                "end": 181,
                "start": 168,
              },
              "value": "createContact",
            },
            "type": Object {
              "kind": "NamedType",
              "loc": Object {
                "end": 214,
                "start": 207,
              },
              "name": Object {
                "kind": "Name",
                "loc": Object {
                  "end": 214,
                  "start": 207,
                },
                "value": "Contact",
              },
            },
          },
        ],
        "interfaces": Array [],
        "kind": "ObjectTypeDefinition",
        "loc": Object {
          "end": 216,
          "start": 150,
        },
        "name": Object {
          "kind": "Name",
          "loc": Object {
            "end": 163,
            "start": 155,
          },
          "value": "Mutation",
        },
      },
    ],
    "kind": "Document",
    "loc": Object {
      "end": 217,
      "start": 0,
    },
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
  const {document, source, schema} = validateSchemaFile(
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
  ).toMatchInlineSnapshot(`
Array [
  "Boolean",
  "String",
  "__Directive",
  "__DirectiveLocation",
  "__EnumValue",
  "__Field",
  "__InputValue",
  "__Schema",
  "__Type",
  "__TypeKind",
]
`);
  expect(JSON.parse(JSON.stringify({document, source}))).toMatchInlineSnapshot(`
Object {
  "document": Object {
    "definitions": Array [
      Object {
        "directives": Array [
          Object {
            "arguments": Array [
              Object {
                "kind": "Argument",
                "loc": Object {
                  "end": 34,
                  "start": 22,
                },
                "name": Object {
                  "kind": "Name",
                  "loc": Object {
                    "end": 28,
                    "start": 22,
                  },
                  "value": "fields",
                },
                "value": Object {
                  "block": false,
                  "kind": "StringValue",
                  "loc": Object {
                    "end": 34,
                    "start": 30,
                  },
                  "value": "id",
                },
              },
            ],
            "kind": "Directive",
            "loc": Object {
              "end": 35,
              "start": 17,
            },
            "name": Object {
              "kind": "Name",
              "loc": Object {
                "end": 21,
                "start": 18,
              },
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
                "loc": Object {
                  "end": 57,
                  "start": 48,
                },
                "name": Object {
                  "kind": "Name",
                  "loc": Object {
                    "end": 57,
                    "start": 49,
                  },
                  "value": "external",
                },
              },
            ],
            "kind": "FieldDefinition",
            "loc": Object {
              "end": 57,
              "start": 40,
            },
            "name": Object {
              "kind": "Name",
              "loc": Object {
                "end": 42,
                "start": 40,
              },
              "value": "id",
            },
            "type": Object {
              "kind": "NonNullType",
              "loc": Object {
                "end": 47,
                "start": 44,
              },
              "type": Object {
                "kind": "NamedType",
                "loc": Object {
                  "end": 46,
                  "start": 44,
                },
                "name": Object {
                  "kind": "Name",
                  "loc": Object {
                    "end": 46,
                    "start": 44,
                  },
                  "value": "ID",
                },
              },
            },
          },
          Object {
            "arguments": Array [],
            "directives": Array [],
            "kind": "FieldDefinition",
            "loc": Object {
              "end": 80,
              "start": 60,
            },
            "name": Object {
              "kind": "Name",
              "loc": Object {
                "end": 75,
                "start": 60,
              },
              "value": "numberOfFriends",
            },
            "type": Object {
              "kind": "NamedType",
              "loc": Object {
                "end": 80,
                "start": 77,
              },
              "name": Object {
                "kind": "Name",
                "loc": Object {
                  "end": 80,
                  "start": 77,
                },
                "value": "Int",
              },
            },
          },
        ],
        "interfaces": Array [],
        "kind": "ObjectTypeExtension",
        "loc": Object {
          "end": 82,
          "start": 0,
        },
        "name": Object {
          "kind": "Name",
          "loc": Object {
            "end": 16,
            "start": 12,
          },
          "value": "User",
        },
      },
    ],
    "kind": "Document",
    "loc": Object {
      "end": 83,
      "start": 0,
    },
  },
  "source": "extend type User @key(fields: \\"id\\") {
  id: ID! @external
  numberOfFriends: Int
}
",
}
`);
});
