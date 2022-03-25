import type Location from '../Location';

export default interface IntValueNode {
  readonly kind: 'IntValue';
  readonly loc: Location;
  readonly value: string;
}
