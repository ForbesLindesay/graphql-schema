import DirectiveNode from '../Directives/DirectiveNode';
import Location from '../Location';
import NameNode from '../NameNode';
import SelectionSetNode from '../SelectionNode/SelectionSetNode';
import VariableDefinitionNode from './VariableDefinitionNode';

export type OperationType = 'query' | 'mutation' | 'subscription';

export default interface OperationDefinitionNode {
  readonly kind: 'OperationDefinition';
  readonly loc: Location;
  readonly operation: OperationType;
  readonly name?: NameNode;
  readonly variableDefinitions: readonly VariableDefinitionNode[];
  readonly directives: readonly DirectiveNode[];
  readonly selectionSet: SelectionSetNode;
}
