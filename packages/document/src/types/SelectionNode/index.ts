import type FieldNode from './FieldNode';
import type FragmentSpreadNode from './FragmentSpreadNode';
import type InlineFragmentNode from './InlineFragmentNode';

type SelectionNode = FieldNode | FragmentSpreadNode | InlineFragmentNode;
export default SelectionNode;
