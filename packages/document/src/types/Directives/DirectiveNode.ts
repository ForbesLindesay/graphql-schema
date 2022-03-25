import type ArgumentNode from '../ArgumentNode';
import type Location from '../Location';
import type NameNode from '../NameNode';

export default interface DirectiveNode {
  readonly kind: 'Directive';
  readonly loc: Location;
  readonly name: NameNode;
  readonly arguments: ArgumentNode[];
}
