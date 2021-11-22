import FragmentDefinitionNode from './FragmentDefinitionNode';
import OperationDefinitionNode from './OperationDefinitionNode';

type ExecutableDefinitionNode =
  | OperationDefinitionNode
  | FragmentDefinitionNode;
export default ExecutableDefinitionNode;
