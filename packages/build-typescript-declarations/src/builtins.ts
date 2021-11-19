import assertNever from 'assert-never';

export type BuiltinType = 'Int' | 'Float' | 'ID' | 'String' | 'Boolean';
export function isBuiltinType(name: string): name is BuiltinType {
  const n = name as BuiltinType;
  switch (n) {
    case 'Int':
    case 'Float':
    case 'ID':
    case 'String':
    case 'Boolean':
      return true;
    default:
      void assertNever(n, true);
      return false;
  }
}
export function getBuiltinType(name: BuiltinType): string {
  switch (name) {
    case 'Int':
    case 'Float':
      return 'number';
    case 'ID':
    case 'String':
      return 'string';
    case 'Boolean':
      return 'boolean';
    default:
      return assertNever(name);
  }
}
