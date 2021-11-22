import Location from '../Location';

export default interface FloatValueNode {
  readonly kind: 'FloatValue';
  readonly loc: Location;
  readonly value: string;
}
