import Location from '../Location';
import NameNode from '../NameNode';

export default interface VariableNode {
  readonly kind: 'Variable';
  readonly loc: Location;
  readonly name: NameNode;
}
