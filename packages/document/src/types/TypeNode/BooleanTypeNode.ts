import Location from '../Location';

export default interface BooleanTypeNode {
  readonly kind: 'BooleanType';
  readonly loc: Location;
}
