// private _valueOfType(type: types.TypeNode, value: unknown): types.ValueNode {
//   if (type.kind === 'NullableType') {
//     if (value === null || value === undefined)
//       return {kind: 'NullValue', loc: type.loc};
//     return this._valueOfType(type.ofType, value);
//   }
//   if (value === null || value === undefined) {
//     return throwError(
//       type,
//       `Cannot assign null to non-nullable type: ${
//         type.kind === 'Name' ? type.value : type.kind
//       }`,
//     );
//   }
//   switch (type.kind) {
//     case 'ListType':
//       if (!Array.isArray(value)) {
//         return throwError(
//           type,
//           `Cannot assign ${inspect(value)} to List type.`,
//         );
//       }
//       return {
//         kind: 'ListValue',
//         loc: type.loc,
//         values: value.map((v) => this._valueOfType(type.ofType, v)),
//       };
//     case 'IntType':
//       if (typeof value !== 'number' || value !== (value | 0)) {
//         return throwError(type, `Cannot assign ${inspect(value)} to Int.`);
//       }
//       return {kind: 'IntValue', loc: type.loc, value: value.toString(10)};
//     case 'FloatType':
//       if (typeof value !== 'number') {
//         return throwError(type, `Cannot assign ${inspect(value)} to Float.`);
//       }
//       return {kind: 'FloatValue', loc: type.loc, value: value.toString(10)};
//     case 'IdType':
//       if (typeof value !== 'number' && typeof value !== 'string') {
//         return throwError(type, `Cannot assign ${inspect(value)} to ID.`);
//       }
//       return {kind: 'StringValue', loc: type.loc, value: value.toString(10)};
//     case 'BooleanType':
//       if (value !== true && value !== false) {
//         return throwError(
//           type,
//           `Cannot assign ${inspect(value)} to Boolean.`,
//         );
//       }
//       return {kind: 'BooleanValue', loc: type.loc, value};
//     case 'StringType':
//       if (typeof value !== 'string') {
//         return throwError(type, `Cannot assign ${inspect(value)} to String.`);
//       }
//       return {kind: 'StringValue', loc: type.loc, value};
//     case 'Name':
//       return this._value(value);
//   }
// }
// private _value(value: unknown): types.ValueNode {
//   const loc = this._source;
//   switch (typeof value) {
//     case 'boolean':
//       return {kind: 'BooleanValue', loc, value};
//     case 'bigint':
//     case 'number':
//       return {kind: 'FloatValue', loc, value: value.toString(10)};
//     case 'string':
//       return {kind: 'StringValue', loc, value};
//     case 'undefined':
//       return {kind: 'NullValue', loc};
//     case 'object':
//       if (value === null) return {kind: 'NullValue', loc};
//       return {
//         kind: 'ObjectValue',
//         loc,
//         fields: Object.entries(value as any).map(
//           ([key, value]): types.ObjectFieldNode => ({
//             kind: 'ObjectField',
//             loc,
//             name: this._nameNode(key),
//             value: this._value(value),
//           }),
//         ),
//       };
//     case 'function':
//     case 'symbol':
//       return throwError(
//         {loc},
//         `Cannot convert ${inspect(value)} to a GraphQL ValueNode`,
//       );
//   }
// }
