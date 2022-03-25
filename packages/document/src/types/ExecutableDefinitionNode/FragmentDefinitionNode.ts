import type DirectiveNode from '../Directives/DirectiveNode';
import type Location from '../Location';
import type NameNode from '../NameNode';
import type SelectionSetNode from '../SelectionNode/SelectionSetNode';
import type VariableDefinitionNode from './VariableDefinitionNode';

export default interface FragmentDefinitionNode {
  readonly kind: 'FragmentDefinition';
  readonly loc: Location;
  readonly name: NameNode;
  // Note: fragment variable definitions are experimental and may be changed
  // or removed in the future.
  readonly variableDefinitions: VariableDefinitionNode[];
  readonly typeCondition: NameNode;
  readonly directives: DirectiveNode[];
  readonly selectionSet: SelectionSetNode;
}
