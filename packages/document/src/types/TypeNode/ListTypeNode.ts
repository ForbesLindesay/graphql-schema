import TypeNode from '.';
import Location from '../Location';

export default interface ListTypeNode {
  readonly kind: 'ListType';
  readonly loc: Location;
  readonly ofType: TypeNode;
}
