import type EnumTypeDefinitionNode from './EnumTypeDefinitionNode';
import type InputObjectTypeDefinitionNode from './InputObjectTypeDefinitionNode';
import type ScalarTypeDefinitionNode from './ScalarTypeDefinition';

type InputTypeDefinitionNode =
  | ScalarTypeDefinitionNode
  | EnumTypeDefinitionNode
  | InputObjectTypeDefinitionNode;

export default InputTypeDefinitionNode;
