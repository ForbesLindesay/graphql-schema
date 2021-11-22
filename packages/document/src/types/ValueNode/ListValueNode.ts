import Location from '../Location';
import ValueNode from '.';

export default interface ListValueNode {
  readonly kind: 'ListValue';
  readonly loc: Location;
  readonly values: readonly ValueNode[];
}
