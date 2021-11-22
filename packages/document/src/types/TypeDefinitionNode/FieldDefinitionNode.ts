import DirectiveNode from '../Directives/DirectiveNode';
import Location from '../Location';
import NameNode from '../NameNode';
import TypeNode from '../TypeNode';
import StringValueNode from '../ValueNode/StringValueNode';
import InputValueDefinitionNode from './InputValueDefinitionNode';

export default interface FieldDefinitionNode {
  readonly kind: 'FieldDefinition';
  readonly loc: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly arguments: readonly InputValueDefinitionNode[];
  readonly type: TypeNode;
  readonly directives: readonly DirectiveNode[];
}
