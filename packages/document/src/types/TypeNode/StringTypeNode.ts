import type Location from '../Location';

export default interface StringTypeNode {
  readonly kind: 'StringType';
  readonly loc: Location;
}
