import type DirectiveNode from '../Directives/DirectiveNode';
import type Location from '../Location';
import type NameNode from '../NameNode';
import type TypeNode from '../TypeNode';
import type ValueNode from '../ValueNode';
import type StringValueNode from '../ValueNode/StringValueNode';

export default interface InputValueDefinitionNode {
  readonly kind: 'InputValueDefinition';
  readonly loc: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly type: TypeNode;
  readonly defaultValue?: ValueNode;
  readonly directives: readonly DirectiveNode[];
}
