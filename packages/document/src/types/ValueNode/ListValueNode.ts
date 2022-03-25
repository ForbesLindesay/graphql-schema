import type ValueNode from '.';
import type Location from '../Location';

export default interface ListValueNode {
  readonly kind: 'ListValue';
  readonly loc: Location;
  readonly values: readonly ValueNode[];
}
