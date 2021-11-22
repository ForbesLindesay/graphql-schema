import NameNode from '../NameNode';
import BooleanTypeNode from './BooleanTypeNode';
import FloatTypeNode from './FloatTypeNode';
import IdTypeNode from './IdTypeNode';
import IntTypeNode from './IntTypeNode';
import ListTypeNode from './ListTypeNode';
import NullableTypeNode from './NullableTypeNode';
import StringTypeNode from './StringTypeNode';

type TypeNode =
  | NameNode
  | ListTypeNode
  | NullableTypeNode
  | BooleanTypeNode
  | FloatTypeNode
  | IdTypeNode
  | IntTypeNode
  | StringTypeNode;

export default TypeNode;
