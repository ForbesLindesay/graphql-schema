import DirectiveNode from '../Directives/DirectiveNode';
import Location from '../Location';
import TypeNode from '../TypeNode';
import ValueNode from '../ValueNode';
import VariableNode from '../ValueNode/VariableNode';

export default interface VariableDefinitionNode {
  readonly kind: 'VariableDefinition';
  readonly loc: Location;
  readonly variable: VariableNode;
  readonly type: TypeNode;
  readonly defaultValue?: ValueNode;
  readonly directives: readonly DirectiveNode[];
}
