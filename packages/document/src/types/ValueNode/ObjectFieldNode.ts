import type ValueNode from '.';
import type Location from '../Location';
import type NameNode from '../NameNode';

export default interface ObjectFieldNode {
  readonly kind: 'ObjectField';
  readonly loc: Location;
  readonly name: NameNode;
  readonly value: ValueNode;
}
