import type DirectiveNode from '../Directives/DirectiveNode';
import type Location from '../Location';
import type NameNode from '../NameNode';
import type StringValueNode from '../ValueNode/StringValueNode';

export default interface ScalarTypeDefinitionNode {
  readonly kind: 'ScalarTypeDefinition';
  readonly loc: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly extend: boolean;
  readonly directives: readonly DirectiveNode[];
}
