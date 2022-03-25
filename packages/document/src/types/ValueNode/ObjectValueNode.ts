import type Location from '../Location';
import type ObjectFieldNode from './ObjectFieldNode';

export default interface ObjectValueNode {
  readonly kind: 'ObjectValue';
  readonly loc: Location;
  readonly fields: ObjectFieldNode[];
}
