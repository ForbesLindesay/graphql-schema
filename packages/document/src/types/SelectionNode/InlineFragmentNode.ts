import DirectiveNode from '../Directives/DirectiveNode';
import Location from '../Location';
import NameNode from '../NameNode';
import SelectionSetNode from './SelectionSetNode';

export default interface InlineFragmentNode {
  readonly kind: 'InlineFragment';
  readonly loc: Location;
  readonly typeCondition?: NameNode;
  readonly directives: DirectiveNode[];
  readonly selectionSet: SelectionSetNode;
}
