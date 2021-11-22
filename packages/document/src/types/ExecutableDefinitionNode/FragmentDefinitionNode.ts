import DirectiveNode from '../Directives/DirectiveNode';
import Location from '../Location';
import NameNode from '../NameNode';
import SelectionSetNode from '../SelectionNode/SelectionSetNode';
import VariableDefinitionNode from './VariableDefinitionNode';

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
