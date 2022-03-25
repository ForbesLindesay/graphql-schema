import type DirectiveNode from '../Directives/DirectiveNode';
import type Location from '../Location';
import type NameNode from '../NameNode';
import type StringValueNode from '../ValueNode/StringValueNode';
import type FieldDefinitionNode from './FieldDefinitionNode';

export default interface ObjectTypeDefinitionNode {
  readonly kind: 'ObjectTypeDefinition';
  readonly loc: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly extend: boolean;
  readonly interfaces: readonly NameNode[];
  readonly directives: readonly DirectiveNode[];
  readonly fields: readonly FieldDefinitionNode[];
}
