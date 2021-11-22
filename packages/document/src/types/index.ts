import type ArgumentNode from './ArgumentNode';
import type DirectiveDefinitionNode from './Directives/DirectiveDefinitionNode';
import type DirectiveLocationNode from './Directives/DirectiveLocation';
import type DirectiveNode from './Directives/DirectiveNode';
import type ExecutableDefinitionNode from './ExecutableDefinitionNode';
import type FragmentDefinitionNode from './ExecutableDefinitionNode/FragmentDefinitionNode';
import type OperationDefinitionNode from './ExecutableDefinitionNode/OperationDefinitionNode';
import type VariableDefinitionNode from './ExecutableDefinitionNode/VariableDefinitionNode';
import type Location from './Location';
import LocationSource from './LocationSource';
import type NameNode from './NameNode';
import type SelectionNode from './SelectionNode';
import type FieldNode from './SelectionNode/FieldNode';
import type FragmentSpreadNode from './SelectionNode/FragmentSpreadNode';
import type InlineFragmentNode from './SelectionNode/InlineFragmentNode';
import type SelectionSetNode from './SelectionNode/SelectionSetNode';
import type TypeDefinitionNode from './TypeDefinitionNode';
import type EnumTypeDefinitionNode from './TypeDefinitionNode/EnumTypeDefinitionNode';
import type EnumValueDefinitionNode from './TypeDefinitionNode/EnumValueDefinitionNode';
import type FieldDefinitionNode from './TypeDefinitionNode/FieldDefinitionNode';
import type InputObjectTypeDefinitionNode from './TypeDefinitionNode/InputObjectTypeDefinitionNode';
import type InputTypeDefinitionNode from './TypeDefinitionNode/InputTypeDefinitionNode';
import type InputValueDefinitionNode from './TypeDefinitionNode/InputValueDefinitionNode';
import type InterfaceTypeDefinitionNode from './TypeDefinitionNode/InterfaceTypeDefinitionNode';
import type ObjectTypeDefinitionNode from './TypeDefinitionNode/ObjectTypeDefinition';
import type ScalarTypeDefinitionNode from './TypeDefinitionNode/ScalarTypeDefinition';
import type UnionTypeDefinitionNode from './TypeDefinitionNode/UnionTypeDefinitionNode';
import type TypeNode from './TypeNode';
import BooleanTypeNode from './TypeNode/BooleanTypeNode';
import FloatTypeNode from './TypeNode/FloatTypeNode';
import IdTypeNode from './TypeNode/IdTypeNode';
import IntTypeNode from './TypeNode/IntTypeNode';
import type ListTypeNode from './TypeNode/ListTypeNode';
import type NullableTypeNode from './TypeNode/NullableTypeNode';
import StringTypeNode from './TypeNode/StringTypeNode';
import type ValueNode from './ValueNode';
import type BooleanValueNode from './ValueNode/BooleanValueNode';
import type EnumValueNode from './ValueNode/EnumValueNode';
import type FloatValueNode from './ValueNode/FloatValueNode';
import type IntValueNode from './ValueNode/IntValueNode';
import JavaScriptValueNode from './ValueNode/JavaScriptValueNode';
import type ListValueNode from './ValueNode/ListValueNode';
import type NullValueNode from './ValueNode/NullValueNode';
import type ObjectFieldNode from './ValueNode/ObjectFieldNode';
import type ObjectValueNode from './ValueNode/ObjectValueNode';
import type StringValueNode from './ValueNode/StringValueNode';
import type VariableNode from './ValueNode/VariableNode';

export type {
  ArgumentNode,
  DirectiveDefinitionNode,
  DirectiveLocationNode,
  DirectiveNode,
  ExecutableDefinitionNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  VariableDefinitionNode,
  Location,
  LocationSource,
  NameNode,
  SelectionNode,
  FieldNode,
  FragmentSpreadNode,
  InlineFragmentNode,
  SelectionSetNode,
  TypeDefinitionNode,
  EnumTypeDefinitionNode,
  EnumValueDefinitionNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputTypeDefinitionNode,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
  ObjectTypeDefinitionNode,
  ScalarTypeDefinitionNode,
  UnionTypeDefinitionNode,
  TypeNode,
  ListTypeNode,
  NullableTypeNode,
  BooleanTypeNode,
  FloatTypeNode,
  IdTypeNode,
  IntTypeNode,
  StringTypeNode,
  ValueNode,
  JavaScriptValueNode,
  BooleanValueNode,
  EnumValueNode,
  FloatValueNode,
  IntValueNode,
  ListValueNode,
  NullValueNode,
  ObjectFieldNode,
  ObjectValueNode,
  StringValueNode,
  VariableNode,
};

/**
 * The list of all possible AST node types.
 */
export type ASTNode =
  | NameNode
  | DocumentNode
  | OperationDefinitionNode
  | VariableDefinitionNode
  | VariableNode
  | SelectionSetNode
  | FieldNode
  | ArgumentNode
  | FragmentSpreadNode
  | InlineFragmentNode
  | FragmentDefinitionNode
  | IntValueNode
  | FloatValueNode
  | StringValueNode
  | BooleanValueNode
  | NullValueNode
  | EnumValueNode
  | ListValueNode
  | ObjectValueNode
  | JavaScriptValueNode
  | ObjectFieldNode
  | DirectiveNode
  | ListTypeNode
  | NullableTypeNode
  | BooleanTypeNode
  | FloatTypeNode
  | IdTypeNode
  | IntTypeNode
  | StringTypeNode
  | ScalarTypeDefinitionNode
  | ObjectTypeDefinitionNode
  | FieldDefinitionNode
  | InputValueDefinitionNode
  | InterfaceTypeDefinitionNode
  | UnionTypeDefinitionNode
  | EnumTypeDefinitionNode
  | EnumValueDefinitionNode
  | InputObjectTypeDefinitionNode
  | DirectiveDefinitionNode
  | DirectiveLocationNode;

/**
 * Utility type listing all nodes indexed by their kind.
 */
export interface ASTKindToNode {
  Name: NameNode;
  Document: DocumentNode;
  OperationDefinition: OperationDefinitionNode;
  VariableDefinition: VariableDefinitionNode;
  Variable: VariableNode;
  SelectionSet: SelectionSetNode;
  Field: FieldNode;
  Argument: ArgumentNode;
  FragmentSpread: FragmentSpreadNode;
  InlineFragment: InlineFragmentNode;
  FragmentDefinition: FragmentDefinitionNode;
  IntValue: IntValueNode;
  FloatValue: FloatValueNode;
  StringValue: StringValueNode;
  BooleanValue: BooleanValueNode;
  NullValue: NullValueNode;
  EnumValue: EnumValueNode;
  ListValue: ListValueNode;
  ObjectValue: ObjectValueNode;
  JavaScriptValue: JavaScriptValueNode;
  ObjectField: ObjectFieldNode;
  Directive: DirectiveNode;
  ListType: ListTypeNode;
  NullableType: NullableTypeNode;
  BooleanType: BooleanTypeNode;
  FloatType: FloatTypeNode;
  IdType: IdTypeNode;
  IntType: IntTypeNode;
  StringType: StringTypeNode;
  ScalarTypeDefinition: ScalarTypeDefinitionNode;
  ObjectTypeDefinition: ObjectTypeDefinitionNode;
  FieldDefinition: FieldDefinitionNode;
  InputValueDefinition: InputValueDefinitionNode;
  InterfaceTypeDefinition: InterfaceTypeDefinitionNode;
  UnionTypeDefinition: UnionTypeDefinitionNode;
  EnumTypeDefinition: EnumTypeDefinitionNode;
  EnumValueDefinition: EnumValueDefinitionNode;
  InputObjectTypeDefinition: InputObjectTypeDefinitionNode;
  DirectiveDefinition: DirectiveDefinitionNode;
  DirectiveLocation: DirectiveLocationNode;
}

// Document

export interface DocumentNode {
  readonly kind: 'Document';
  readonly loc: Location;
  readonly definitions: ReadonlyArray<DefinitionNode>;
}

export type DefinitionNode =
  | TypeSystemDefinitionNode
  | ExecutableDefinitionNode;

// Type System Definition

export type TypeSystemDefinitionNode =
  | TypeDefinitionNode
  | DirectiveDefinitionNode;
