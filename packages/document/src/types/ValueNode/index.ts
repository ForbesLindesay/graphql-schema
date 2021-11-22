import BooleanValueNode from './BooleanValueNode';
import EnumValueNode from './EnumValueNode';
import FloatValueNode from './FloatValueNode';
import IntValueNode from './IntValueNode';
import JavaScriptValueNode from './JavaScriptValueNode';
import ListValueNode from './ListValueNode';
import NullValueNode from './NullValueNode';
import ObjectValueNode from './ObjectValueNode';
import StringValueNode from './StringValueNode';
import VariableNode from './VariableNode';

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
