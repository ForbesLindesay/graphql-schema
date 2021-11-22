import EnumTypeDefinitionNode from './EnumTypeDefinitionNode';
import InputObjectTypeDefinitionNode from './InputObjectTypeDefinitionNode';
import ScalarTypeDefinitionNode from './ScalarTypeDefinition';

type InputTypeDefinitionNode =
  | ScalarTypeDefinitionNode
  | EnumTypeDefinitionNode
  | InputObjectTypeDefinitionNode;

export default InputTypeDefinitionNode;
