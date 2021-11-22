import EnumTypeDefinitionNode from './EnumTypeDefinitionNode';
import InputObjectTypeDefinitionNode from './InputObjectTypeDefinitionNode';
import InterfaceTypeDefinitionNode from './InterfaceTypeDefinitionNode';
import ObjectTypeDefinitionNode from './ObjectTypeDefinition';
import ScalarTypeDefinitionNode from './ScalarTypeDefinition';
import UnionTypeDefinitionNode from './UnionTypeDefinitionNode';

type TypeDefinitionNode =
  | ScalarTypeDefinitionNode
  | ObjectTypeDefinitionNode
  | InterfaceTypeDefinitionNode
  | UnionTypeDefinitionNode
  | EnumTypeDefinitionNode
  | InputObjectTypeDefinitionNode;
export default TypeDefinitionNode;
