import DirectiveNode from '../Directives/DirectiveNode';
import Location from '../Location';
import NameNode from '../NameNode';
import StringValueNode from '../ValueNode/StringValueNode';

export default interface ScalarTypeDefinitionNode {
  readonly kind: 'ScalarTypeDefinition';
  readonly loc: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly extend: boolean;
  readonly directives: readonly DirectiveNode[];
}
