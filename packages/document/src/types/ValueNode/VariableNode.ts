import type Location from '../Location';
import type NameNode from '../NameNode';

export default interface VariableNode {
  readonly kind: 'Variable';
  readonly loc: Location;
  readonly name: NameNode;
}
