import Location from '../Location';
import NameNode from '../NameNode';
import BooleanTypeNode from './BooleanTypeNode';
import FloatTypeNode from './FloatTypeNode';
import IdTypeNode from './IdTypeNode';
import IntTypeNode from './IntTypeNode';
import ListTypeNode from './ListTypeNode';
import StringTypeNode from './StringTypeNode';

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
