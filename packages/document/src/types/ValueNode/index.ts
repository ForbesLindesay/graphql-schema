import type BooleanValueNode from './BooleanValueNode';
import type EnumValueNode from './EnumValueNode';
import type FloatValueNode from './FloatValueNode';
import type IntValueNode from './IntValueNode';
import type JavaScriptValueNode from './JavaScriptValueNode';
import type ListValueNode from './ListValueNode';
import type NullValueNode from './NullValueNode';
import type ObjectValueNode from './ObjectValueNode';
import type StringValueNode from './StringValueNode';
import type VariableNode from './VariableNode';

type ValueNode =
  | VariableNode
  | IntValueNode
  | FloatValueNode
  | StringValueNode
  | BooleanValueNode
  | NullValueNode
  | EnumValueNode
  | ListValueNode
  | ObjectValueNode
  | JavaScriptValueNode;

export default ValueNode;
