import Location from './Location';

export default interface NameNode {
  readonly kind: 'Name';
  readonly loc: Location;
  readonly value: string;
}
