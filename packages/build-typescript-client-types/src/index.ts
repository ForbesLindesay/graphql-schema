import type {GraphQLResolverObject} from '@graphql-schema/build-typescript-declarations';
import {
  comment,
  getArgumentsType,
  getOutputType,
  isBuiltinType,
  FieldTypeOptions,
} from '@graphql-schema/build-typescript-declarations';
import {ITypeScriptWriter} from '@graphql-schema/typescript-writer';
import {GraphQLNamedType, isScalarType} from 'graphql';
