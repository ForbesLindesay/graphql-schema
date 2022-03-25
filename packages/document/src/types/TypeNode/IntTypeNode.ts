import type Location from '../Location';

export default interface IntTypeNode {
  readonly kind: 'IntType';
  readonly loc: Location;
}
