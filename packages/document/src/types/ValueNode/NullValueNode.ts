import type Location from '../Location';

export default interface NullValueNode {
  readonly kind: 'NullValue';
  readonly loc: Location;
}
