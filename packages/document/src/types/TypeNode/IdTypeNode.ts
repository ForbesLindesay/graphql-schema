import type Location from '../Location';

export default interface IdTypeNode {
  readonly kind: 'IdType';
  readonly loc: Location;
}
