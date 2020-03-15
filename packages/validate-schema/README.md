# @graphql-schema/validate-schema

Parse & validate a GraphQL Schema and throw clear errors if anything is wrong.

## Installation

```
yarn add @graphql-schema/validate-schema
```

## Usage

```ts
import validateSchema, {
  validateSchemaFile,
} from '@graphql-schema/validate-schema';

validateSchemaFile('./my-schema.graphql');
validateSchema('query { login: String! }');
```

### Federated Schemas

```ts
import validateSchema, {
  validateSchemaFile,
} from '@graphql-schema/validate-schema';

validateSchemaFile('./my-schema.graphql', {isFederated: true});
validateSchema('query { login: String! }', {isFederated: true});
```
