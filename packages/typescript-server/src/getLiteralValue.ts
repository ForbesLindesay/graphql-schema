import type {ValueNode} from 'graphql';

export default function getLiteralValue(
  literal: ValueNode,
  variables: {[key: string]: any} | null,
): unknown {
  switch (literal.kind) {
    case 'IntValue':
      return parseInt(literal.value, 10);
    case 'FloatValue':
      return parseFloat(literal.value);
    case 'StringValue':
      return literal.value;
    case 'BooleanValue':
      return literal.value;
    case 'NullValue':
      return null;
    case 'EnumValue':
      return literal.value;
    case 'ListValue':
      return literal.values.map((v) => getLiteralValue(v, variables));
    case 'ObjectValue':
      return Object.fromEntries(
        literal.fields.map((f) => [
          f.name.value,
          getLiteralValue(f.value, variables),
        ]),
      );
    case 'Variable':
      if (!variables) return null;
      return variables[literal.name.value];
  }
}
