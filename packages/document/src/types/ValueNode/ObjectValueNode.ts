import Location from '../Location';
import ObjectFieldNode from './ObjectFieldNode';

export default interface ObjectValueNode {
  readonly kind: 'ObjectValue';
  readonly loc: Location;
  readonly fields: ObjectFieldNode[];
}
