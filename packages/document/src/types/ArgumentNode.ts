import Location from './Location';
import NameNode from './NameNode';
import ValueNode from './ValueNode';

export default interface ArgumentNode {
  readonly kind: 'Argument';
  readonly loc: Location;
  readonly name: NameNode;
  readonly value: ValueNode;
}
