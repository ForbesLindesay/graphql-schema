import type EnumTypeDefinitionNode from './EnumTypeDefinitionNode';
import type InputObjectTypeDefinitionNode from './InputObjectTypeDefinitionNode';
import type InterfaceTypeDefinitionNode from './InterfaceTypeDefinitionNode';
import type ObjectTypeDefinitionNode from './ObjectTypeDefinition';
import type ScalarTypeDefinitionNode from './ScalarTypeDefinition';
import type UnionTypeDefinitionNode from './UnionTypeDefinitionNode';

type TypeDefinitionNode =
  | ScalarTypeDefinitionNode
  | ObjectTypeDefinitionNode
  | InterfaceTypeDefinitionNode
  | UnionTypeDefinitionNode
  | EnumTypeDefinitionNode
  | InputObjectTypeDefinitionNode;
export default TypeDefinitionNode;
