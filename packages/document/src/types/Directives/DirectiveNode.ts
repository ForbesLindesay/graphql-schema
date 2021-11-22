import ArgumentNode from '../ArgumentNode';
import Location from '../Location';
import NameNode from '../NameNode';

export default interface DirectiveNode {
  readonly kind: 'Directive';
  readonly loc: Location;
  readonly name: NameNode;
  readonly arguments: ArgumentNode[];
}
