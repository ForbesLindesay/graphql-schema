import DirectiveNode from '../Directives/DirectiveNode';
import Location from '../Location';
import NameNode from '../NameNode';
import StringValueNode from '../ValueNode/StringValueNode';
import EnumValueDefinitionNode from './EnumValueDefinitionNode';

export default interface EnumTypeDefinitionNode {
  readonly kind: 'EnumTypeDefinition';
  readonly loc: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly extend: boolean;
  readonly directives: readonly DirectiveNode[];
  readonly values: readonly EnumValueDefinitionNode[];
}
