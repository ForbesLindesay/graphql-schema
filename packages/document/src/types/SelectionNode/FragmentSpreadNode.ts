import type DirectiveNode from '../Directives/DirectiveNode';
import type Location from '../Location';
import type NameNode from '../NameNode';

export default interface FragmentSpreadNode {
  readonly kind: 'FragmentSpread';
  readonly loc: Location;
  readonly name: NameNode;
  readonly directives: readonly DirectiveNode[];
}
