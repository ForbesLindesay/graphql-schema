import type DirectiveNode from '../Directives/DirectiveNode';
import type Location from '../Location';
import type NameNode from '../NameNode';
import type SelectionSetNode from './SelectionSetNode';

export default interface InlineFragmentNode {
  readonly kind: 'InlineFragment';
  readonly loc: Location;
  readonly typeCondition?: NameNode;
  readonly directives: DirectiveNode[];
  readonly selectionSet: SelectionSetNode;
}
