import type DirectiveNode from '../Directives/DirectiveNode';
import type Location from '../Location';
import type NameNode from '../NameNode';
import type SelectionSetNode from '../SelectionNode/SelectionSetNode';
import type VariableDefinitionNode from './VariableDefinitionNode';

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
