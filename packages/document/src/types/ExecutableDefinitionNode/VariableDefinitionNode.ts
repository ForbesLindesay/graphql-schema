import type DirectiveNode from '../Directives/DirectiveNode';
import type Location from '../Location';
import type TypeNode from '../TypeNode';
import type ValueNode from '../ValueNode';
import type VariableNode from '../ValueNode/VariableNode';

export default interface VariableDefinitionNode {
  readonly kind: 'VariableDefinition';
  readonly loc: Location;
  readonly variable: VariableNode;
  readonly type: TypeNode;
  readonly defaultValue?: ValueNode;
  readonly directives: readonly DirectiveNode[];
}
