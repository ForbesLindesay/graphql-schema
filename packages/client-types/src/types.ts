import {types} from '@graphql-schema/document';

export interface TypeNameTypeNode {
  readonly kind: 'ClientTypeNameType';
  readonly name: types.NameNode;
}

export interface ListTypeNode<
  TObjectTypeNode extends {readonly kind: 'ClientObjectType'}
> {
  readonly kind: 'ClientListType';
  readonly ofType: TypeNode<TObjectTypeNode>;
}

export interface UnionTypeNode<
  TObjectTypeNode extends {readonly kind: 'ClientObjectType'},
  T extends TypeExceptNullableAndUnion<TObjectTypeNode>
> {
  readonly kind: 'ClientUnionType';
  readonly types: readonly T[];
}

export interface NullTypeNode<
  TObjectTypeNode extends {readonly kind: 'ClientObjectType'},
  T extends TypeExceptNullableNode<TObjectTypeNode>
> {
  readonly kind: 'ClientNullType';
  readonly ofType: T;
}

export interface FieldNode<
  TObjectTypeNode extends {readonly kind: 'ClientObjectType'}
> {
  readonly kind: 'ClientField';
  readonly loc: types.Location;
  readonly description?: types.StringValueNode;
  readonly name: types.NameNode;
  readonly type: TypeNode<TObjectTypeNode>;
}

export interface InputObjectTypeNode {
  readonly kind: 'ClientObjectType';
  readonly name: types.NameNode;
  readonly fields: readonly FieldNode<InputObjectTypeNode>[];
}
export interface OutputObjectTypeNode {
  readonly kind: 'ClientObjectType';
  readonly name?: types.NameNode;
  readonly fields: readonly FieldNode<OutputObjectTypeNode>[];
}
export type BooleanTypeNode = types.BooleanTypeNode;
export type FloatTypeNode = types.FloatTypeNode;
export type IdTypeNode = types.IdTypeNode;
export type IntTypeNode = types.IntTypeNode;
export type StringTypeNode = types.StringTypeNode;
export type ScalarTypeDefinitionNode = types.ScalarTypeDefinitionNode;
export type EnumTypeDefinitionNode = types.EnumTypeDefinitionNode;

export type TypeExceptObjectAndList =
  // resolved client types (except object & list)
  | TypeNameTypeNode
  // primitive types
  | BooleanTypeNode
  | FloatTypeNode
  | IdTypeNode
  | IntTypeNode
  | StringTypeNode
  // named types
  | ScalarTypeDefinitionNode
  | EnumTypeDefinitionNode;

export type TypeExceptNullableAndUnion<
  TObjectTypeNode extends {readonly kind: 'ClientObjectType'}
> = TypeExceptObjectAndList | TObjectTypeNode | ListTypeNode<TObjectTypeNode>;

export type TypeExceptNullableNode<
  TObjectTypeNode extends {readonly kind: 'ClientObjectType'}
> =
  | UnionTypeNode<TObjectTypeNode, TypeExceptNullableAndUnion<TObjectTypeNode>>
  | TypeExceptNullableAndUnion<TObjectTypeNode>;

export type TypeNode<
  TObjectTypeNode extends {readonly kind: 'ClientObjectType'}
> =
  | NullTypeNode<TObjectTypeNode, TypeExceptNullableNode<TObjectTypeNode>>
  | TypeExceptNullableNode<TObjectTypeNode>;

export type OutputTypeNode = TypeNode<OutputObjectTypeNode>;
export type InputTypeNode = TypeNode<InputObjectTypeNode>;
