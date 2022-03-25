import type Location from './Location';
import type NameNode from './NameNode';
import type ValueNode from './ValueNode';

export default interface ArgumentNode {
  readonly kind: 'Argument';
  readonly loc: Location;
  readonly name: NameNode;
  readonly value: ValueNode;
}
