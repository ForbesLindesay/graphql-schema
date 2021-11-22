import DirectiveNode from '../Directives/DirectiveNode';
import Location from '../Location';
import NameNode from '../NameNode';
import StringValueNode from '../ValueNode/StringValueNode';

export default interface EnumValueDefinitionNode {
  readonly kind: 'EnumValueDefinition';
  readonly loc: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly directives: readonly DirectiveNode[];
}
