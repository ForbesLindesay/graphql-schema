import type ArgumentNode from '../ArgumentNode';
import type DirectiveNode from '../Directives/DirectiveNode';
import type Location from '../Location';
import type NameNode from '../NameNode';
import type SelectionSetNode from './SelectionSetNode';

export default interface FieldNode {
  readonly kind: 'Field';
  readonly loc: Location;
  readonly alias: NameNode;
  readonly name: NameNode;
  readonly arguments: readonly ArgumentNode[];
  readonly directives: readonly DirectiveNode[];
  readonly selectionSet?: SelectionSetNode;
}
