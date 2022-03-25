import type FragmentDefinitionNode from './FragmentDefinitionNode';
import type OperationDefinitionNode from './OperationDefinitionNode';

type ExecutableDefinitionNode =
  | OperationDefinitionNode
  | FragmentDefinitionNode;
export default ExecutableDefinitionNode;
