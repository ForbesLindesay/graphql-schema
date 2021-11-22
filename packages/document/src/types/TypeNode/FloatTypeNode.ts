import Location from '../Location';

export default interface FloatTypeNode {
  readonly kind: 'FloatType';
  readonly loc: Location;
}
