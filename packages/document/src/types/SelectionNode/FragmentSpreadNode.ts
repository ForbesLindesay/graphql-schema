import DirectiveNode from '../Directives/DirectiveNode';
import Location from '../Location';
import NameNode from '../NameNode';

export default interface FragmentSpreadNode {
  readonly kind: 'FragmentSpread';
  readonly loc: Location;
  readonly name: NameNode;
  readonly directives: readonly DirectiveNode[];
}
