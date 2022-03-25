import type Location from '../Location';
import type NameNode from '../NameNode';
import type BooleanTypeNode from './BooleanTypeNode';
import type FloatTypeNode from './FloatTypeNode';
import type IdTypeNode from './IdTypeNode';
import type IntTypeNode from './IntTypeNode';
import type ListTypeNode from './ListTypeNode';
import type StringTypeNode from './StringTypeNode';

export default interface NullableTypeNode {
  readonly kind: 'NullableType';
  readonly loc: Location;
  readonly ofType:
    | NameNode
    | ListTypeNode
    | BooleanTypeNode
    | FloatTypeNode
    | IdTypeNode
    | IntTypeNode
    | StringTypeNode;
}
