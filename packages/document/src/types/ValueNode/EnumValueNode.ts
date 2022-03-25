import type Location from '../Location';

export default interface EnumValueNode {
  readonly kind: 'EnumValue';
  readonly loc: Location;
  readonly value: string;
}
