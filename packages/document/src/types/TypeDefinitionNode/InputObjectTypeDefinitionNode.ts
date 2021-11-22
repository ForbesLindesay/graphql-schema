import DirectiveNode from '../Directives/DirectiveNode';
import Location from '../Location';
import NameNode from '../NameNode';
import StringValueNode from '../ValueNode/StringValueNode';
import InputValueDefinitionNode from './InputValueDefinitionNode';

export default interface InputObjectTypeDefinitionNode {
  readonly kind: 'InputObjectTypeDefinition';
  readonly loc: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly extend: boolean;
  readonly directives: readonly DirectiveNode[];
  readonly fields: readonly InputValueDefinitionNode[];
}
