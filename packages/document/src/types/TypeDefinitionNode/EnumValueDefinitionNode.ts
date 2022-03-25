import type DirectiveNode from '../Directives/DirectiveNode';
import type Location from '../Location';
import type NameNode from '../NameNode';
import type StringValueNode from '../ValueNode/StringValueNode';

export default interface EnumValueDefinitionNode {
  readonly kind: 'EnumValueDefinition';
  readonly loc: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly directives: readonly DirectiveNode[];
}
