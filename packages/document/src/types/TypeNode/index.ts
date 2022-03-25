import type NameNode from '../NameNode';
import type BooleanTypeNode from './BooleanTypeNode';
import type FloatTypeNode from './FloatTypeNode';
import type IdTypeNode from './IdTypeNode';
import type IntTypeNode from './IntTypeNode';
import type ListTypeNode from './ListTypeNode';
import type NullableTypeNode from './NullableTypeNode';
import type StringTypeNode from './StringTypeNode';

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
