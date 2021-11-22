import {types} from '@graphql-schema/document';

export interface TypeNameTypeNode {
  readonly kind: 'ClientTypeNameType';
  readonly name: types.NameNode;
}

export interface ListTypeNode {
  readonly kind: 'ClientListType';
  readonly ofType: TypeNode;
}

export interface UnionTypeNode {
  readonly kind: 'ClientUnionType';
  readonly types: readonly TypeExceptUnionNode[];
}

export interface NullTypeNode {
  readonly kind: 'ClientNullType';
}

export interface FieldNode {
  readonly kind: 'ClientField';
  readonly loc: types.Location;
  readonly description?: types.StringValueNode;
  readonly name: types.NameNode;
  readonly type: TypeNode;
}

export interface ObjectTypeNode {
  readonly kind: 'ClientObjectType';
  readonly name?: types.NameNode;
  readonly fields: readonly FieldNode[];
}
export type BooleanTypeNode = types.BooleanTypeNode;
export type FloatTypeNode = types.FloatTypeNode;
export type IdTypeNode = types.IdTypeNode;
export type IntTypeNode = types.IntTypeNode;
export type StringTypeNode = types.StringTypeNode;
export type ScalarTypeDefinitionNode = types.ScalarTypeDefinitionNode;
export type EnumTypeDefinitionNode = types.EnumTypeDefinitionNode;

export type TypeExceptUnionNode =
  // resolved client types
  | TypeNameTypeNode
  | ObjectTypeNode
  | NullTypeNode
  | ListTypeNode
  // primitive types
  | BooleanTypeNode
  | FloatTypeNode
  | IdTypeNode
  | IntTypeNode
  | StringTypeNode
  // named types
  | ScalarTypeDefinitionNode
  | EnumTypeDefinitionNode;

export type TypeNode = UnionTypeNode | TypeExceptUnionNode;
