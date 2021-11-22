import ValueNode from '.';
import Location from '../Location';
import NameNode from '../NameNode';

export default interface ObjectFieldNode {
  readonly kind: 'ObjectField';
  readonly loc: Location;
  readonly name: NameNode;
  readonly value: ValueNode;
}
