import DirectiveNode from '../Directives/DirectiveNode';
import Location from '../Location';
import NameNode from '../NameNode';
import StringValueNode from '../ValueNode/StringValueNode';
import FieldDefinitionNode from './FieldDefinitionNode';

export default interface InterfaceTypeDefinitionNode {
  readonly kind: 'InterfaceTypeDefinition';
  readonly loc: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly extend: boolean;
  readonly directives: readonly DirectiveNode[];
  readonly fields: readonly FieldDefinitionNode[];
}
