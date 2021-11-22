import Location from '../Location';

export default interface StringValueNode {
  readonly kind: 'StringValue';
  readonly loc: Location;
  readonly value: string;
  readonly block?: boolean;
}
