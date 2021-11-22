import ArgumentNode from '../ArgumentNode';
import DirectiveNode from '../Directives/DirectiveNode';
import Location from '../Location';
import NameNode from '../NameNode';
import SelectionSetNode from './SelectionSetNode';

export default interface FieldNode {
  readonly kind: 'Field';
  readonly loc: Location;
  readonly alias: NameNode;
  readonly name: NameNode;
  readonly arguments: readonly ArgumentNode[];
  readonly directives: readonly DirectiveNode[];
  readonly selectionSet?: SelectionSetNode;
}
