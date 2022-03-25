import type SelectionNode from '.';
import type Location from '../Location';

export default interface SelectionSetNode {
  readonly kind: 'SelectionSet';
  readonly loc: Location;
  readonly selections: readonly SelectionNode[];
}
