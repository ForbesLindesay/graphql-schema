import FieldNode from './FieldNode';
import FragmentSpreadNode from './FragmentSpreadNode';
import InlineFragmentNode from './InlineFragmentNode';

type SelectionNode = FieldNode | FragmentSpreadNode | InlineFragmentNode;
export default SelectionNode;
