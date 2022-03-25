import type Location from '../Location';
import type NameNode from '../NameNode';
import type InputValueDefinitionNode from '../TypeDefinitionNode/InputValueDefinitionNode';
import type StringValueNode from '../ValueNode/StringValueNode';
import type DirectiveLocationNode from './DirectiveLocation';

export default interface DirectiveDefinitionNode {
  readonly kind: 'DirectiveDefinition';
  readonly loc: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly arguments: readonly InputValueDefinitionNode[];
  readonly isRepeatable: boolean;
  readonly locations: readonly DirectiveLocationNode[];
}
