import type DirectiveNode from '../Directives/DirectiveNode';
import type Location from '../Location';
import type NameNode from '../NameNode';
import type StringValueNode from '../ValueNode/StringValueNode';
import type EnumValueDefinitionNode from './EnumValueDefinitionNode';

export default interface EnumTypeDefinitionNode {
  readonly kind: 'EnumTypeDefinition';
  readonly loc: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly extend: boolean;
  readonly directives: readonly DirectiveNode[];
  readonly values: readonly EnumValueDefinitionNode[];
}
