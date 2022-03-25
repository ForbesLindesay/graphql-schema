import type DirectiveNode from '../Directives/DirectiveNode';
import type Location from '../Location';
import type NameNode from '../NameNode';
import type StringValueNode from '../ValueNode/StringValueNode';
import type InputValueDefinitionNode from './InputValueDefinitionNode';

export default interface InputObjectTypeDefinitionNode {
  readonly kind: 'InputObjectTypeDefinition';
  readonly loc: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly extend: boolean;
  readonly directives: readonly DirectiveNode[];
  readonly fields: readonly InputValueDefinitionNode[];
}
