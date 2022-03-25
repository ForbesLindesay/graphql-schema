import type DirectiveNode from '../Directives/DirectiveNode';
import type Location from '../Location';
import type NameNode from '../NameNode';
import type TypeNode from '../TypeNode';
import type StringValueNode from '../ValueNode/StringValueNode';
import type InputValueDefinitionNode from './InputValueDefinitionNode';

export default interface FieldDefinitionNode {
  readonly kind: 'FieldDefinition';
  readonly loc: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly arguments: readonly InputValueDefinitionNode[];
  readonly type: TypeNode;
  readonly directives: readonly DirectiveNode[];
}
