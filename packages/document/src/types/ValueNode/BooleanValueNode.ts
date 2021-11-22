import Location from '../Location';

export default interface BooleanValueNode {
  readonly kind: 'BooleanValue';
  readonly loc: Location;
  readonly value: boolean;
}
