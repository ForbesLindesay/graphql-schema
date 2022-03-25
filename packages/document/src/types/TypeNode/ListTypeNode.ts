import type TypeNode from '.';
import type Location from '../Location';

export default interface ListTypeNode {
  readonly kind: 'ListType';
  readonly loc: Location;
  readonly ofType: TypeNode;
}
