import DirectiveNode from '../Directives/DirectiveNode';
import Location from '../Location';
import NameNode from '../NameNode';
import TypeNode from '../TypeNode';
import ValueNode from '../ValueNode';
import StringValueNode from '../ValueNode/StringValueNode';

export default interface InputValueDefinitionNode {
  readonly kind: 'InputValueDefinition';
  readonly loc: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly type: TypeNode;
  readonly defaultValue?: ValueNode;
  readonly directives: readonly DirectiveNode[];
}
