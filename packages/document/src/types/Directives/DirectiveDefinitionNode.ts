import Location from '../Location';
import NameNode from '../NameNode';
import InputValueDefinitionNode from '../TypeDefinitionNode/InputValueDefinitionNode';
import StringValueNode from '../ValueNode/StringValueNode';
import DirectiveLocationNode from './DirectiveLocation';

export default interface DirectiveDefinitionNode {
  readonly kind: 'DirectiveDefinition';
  readonly loc: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly arguments: readonly InputValueDefinitionNode[];
  readonly isRepeatable: boolean;
  readonly locations: readonly DirectiveLocationNode[];
}
