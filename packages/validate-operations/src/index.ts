import {readFileSync} from 'fs';
import {relative} from 'path';

import type {
  DocumentNode,
  GraphQLError as RawGraphQLError,
  GraphQLSchema,
} from 'graphql';
import {parse as parseOperations, Source} from 'graphql';
import {validate} from 'graphql/validation/validate';

import type {types} from '@graphql-schema/document';
import type GraphQlDocument from '@graphql-schema/document';
import {errors, fromDocumentNode} from '@graphql-schema/document';

export interface ValidateOperationsOptions {
  schema: GraphQLSchema;
  schemaDocument: GraphQlDocument;
  filename?: string;
}
export interface ValidateOperationsResult {
  operationsString: string;
  document: GraphQlDocument;
  documentNode: DocumentNode;
}

export function validateOperationsFile(
  filename: string,
  options: Omit<ValidateOperationsOptions, 'filename'>,
): ValidateOperationsResult {
  let operationsString: string;
  try {
    operationsString = readFileSync(filename, 'utf8');
  } catch (ex: any) {
    if (ex.code === 'ENOENT') {
      return errors.throwGraphQlError(
        'ENOENT',
        `Could not find the operations at ${filename}`,
        {
          loc: {kind: 'FileLocationSource', filename, source: ``},
        },
      );
    }
    throw ex;
  }
  return validateOperations(operationsString, {
    ...options,
    filename: relative(process.cwd(), filename).replace(/\\/g, '/'),
  });
}
export default function validateOperations(
  operationsString: string,
  options: ValidateOperationsOptions,
): ValidateOperationsResult {
  let documentNode: DocumentNode;
  try {
    documentNode = parseOperations(
      new Source(operationsString, options.filename),
    );
  } catch (ex: any) {
    return errors.throwGraphQlError(
      'GRAPH_OPERATIONS_SYNTAX_ERROR',
      ex.message,
      {
        loc: getLocation(ex, {operationsString, filename: options.filename}),
      },
    );
  }

  const document = fromDocumentNode(documentNode, {
    referencedDocuments: [options.schemaDocument],
    source: options.filename
      ? {
          kind: 'FileLocationSource',
          filename: options.filename,
          source: operationsString,
        }
      : {kind: 'StringLocationSource', source: operationsString},
  });

  const validationErrors = validate(options.schema, documentNode);
  if (validationErrors.length) {
    return errors.throwGraphQlError(
      `GRAPHQL_OPERATIONS_ERROR`,
      validationErrors[0].message,
      {
        loc: getLocation(validationErrors[0], {
          operationsString,
          filename: options.filename,
        }),
        errors:
          validationErrors.length > 1
            ? validationErrors.map((err) =>
                errors.createGraphQlError(
                  `GRAPHQL_OPERATIONS_ERROR`,
                  err.message,
                  {
                    loc: getLocation(err, {
                      operationsString,
                      filename: options.filename,
                    }),
                  },
                ),
              )
            : [],
      },
    );
  }

  // const seenNames = new Set<string>();
  // for (const fragment of document.getFragments({
  //   includeReferencedDocuments: false,
  // })) {
  //   if (seenNames.has(fragment.name.value)) {
  //     return throwGraphQlError(
  //       `Duplicate fragment name "${fragment.name.value}"`,
  //       {node: fragment.name},
  //     );
  //   }

  //   const type = document.getTypeX(fragment.typeCondition);
  //   if (
  //     type.kind !== 'ObjectTypeDefinition' &&
  //     type.kind !== 'InterfaceTypeDefinition' &&
  //     type.kind !== 'UnionTypeDefinition'
  //   ) {
  //     return throwGraphQlError(
  //       `Fragment type condition cannot reference "${fragment.typeCondition.value}" because it is a ${type.kind}`,
  //       {node: fragment.typeCondition},
  //     );
  //   }

  //   validateSelectionSet(fragment.selectionSet, type, document, new Map());
  // }
  return {operationsString, document, documentNode};
}

// function flattenUnionOrInterface(
//   type:
//     | types.ObjectTypeDefinitionNode
//     | types.UnionTypeDefinitionNode
//     | types.InterfaceTypeDefinitionNode,
//   document: GraphQlDocument,
// ): readonly types.ObjectTypeDefinitionNode[] {
//   switch (type.kind) {
//     case 'UnionTypeDefinition':
//       return type.types.flatMap((name) => {
//         const type = document.getTypeX(name);
//         if (
//           type.kind !== 'ObjectTypeDefinition' &&
//           type.kind !== 'InterfaceTypeDefinition' &&
//           type.kind !== 'UnionTypeDefinition'
//         ) {
//           return throwGraphQlError(
//             `Union type cannot reference "${name.value}" because it is a ${type.kind}`,
//             {node: name},
//           );
//         }
//         return flattenUnionOrInterface(type, document);
//       });
//     case 'InterfaceTypeDefinition':
//       return document.getInterfaceImplementations(type);
//     case 'ObjectTypeDefinition':
//       return [type];
//     default:
//       return assertNever(type);
//   }
// }

// function validateSelectionSet(
//   selectionSet: types.SelectionSetNode,
//   type:
//     | types.ObjectTypeDefinitionNode
//     | types.InterfaceTypeDefinitionNode
//     | types.UnionTypeDefinitionNode,
//   document: GraphQlDocument,
//   variables: ReadonlyMap<string, types.VariableDefinitionNode>,
// ): void {
//   switch (type.kind) {
//     case 'UnionTypeDefinition':
//     case 'InterfaceTypeDefinition':
//       for (const t of flattenUnionOrInterface(type, document)) {
//         validateSelectionSet(
//           {
//             ...selectionSet,
//             selections: selectionSet.selections.filter((s) => {
//               switch (s.kind) {
//                 case 'Field':
//                   return true;
//                 case 'InlineFragment':
//                   return (
//                     !s.typeCondition ||
//                     objectTypeMatchesCondition(t, s.typeCondition, {
//                       document,
//                     })
//                   );
//                 case 'FragmentSpread': {
//                   const fragment = document.getFragmentX(s.name);
//                   return objectTypeMatchesCondition(t, fragment.typeCondition, {
//                     document,
//                   });
//                 }
//               }
//             }),
//           },
//           t,
//           document,
//           variables,
//         );
//       }
//       break;
//     case 'ObjectTypeDefinition':
//       for (const selection of selectionSet.selections) {
//         switch (selection.kind) {
//           case 'Field':
//             validateSelectionField(selection, type, document, variables);
//             break;
//           case 'InlineFragment':
//             if (
//               selection.typeCondition &&
//               !objectTypeMatchesCondition(type, selection.typeCondition, {
//                 document,
//               })
//             ) {
//               throwGraphQlError(
//                 `Invalid type condition on selection set, expected ${type.name.value} but got ${selection.typeCondition.value}`,
//                 {node: selection},
//               );
//             }
//             validateSelectionSet(
//               selection.selectionSet,
//               type,
//               document,
//               variables,
//             );
//             break;
//           case 'FragmentSpread': {
//             const fragment = document.getFragmentX(selection.name);
//             if (
//               !objectTypeMatchesCondition(type, fragment.typeCondition, {
//                 document,
//               })
//             ) {
//               throwGraphQlError(
//                 `Invalid type condition on fragment, expected ${type.name.value} but got ${fragment.typeCondition.value}`,
//                 {node: selection},
//               );
//             }
//             validateSelectionSet(
//               fragment.selectionSet,
//               type,
//               document,
//               variables,
//             );
//             break;
//           }
//         }
//       }
//       break;
//     default:
//       return assertNever(type);
//   }
// }

// function validateSelectionField(
//   selection: types.FieldNode,
//   type: types.ObjectTypeDefinitionNode | types.InterfaceTypeDefinitionNode,
//   document: GraphQlDocument,
//   variables: ReadonlyMap<string, types.VariableDefinitionNode>,
// ): void {
//   if (selection.name.value === '__typename') return;

//   // check the field exists
//   const field = type.fields.find((f) => f.name.value === selection.name.value);
//   if (!field) {
//     return throwGraphQlError(
//       `The field ${selection.name.value} does not exit on ${type.name.value}`,
//       {node: selection},
//     );
//   }

//   // check all required args are passed
//   const actualArgNames = new Set(selection.arguments.map((a) => a.name.value));
//   for (const expectedArg of field.arguments) {
//     if (
//       expectedArg.type.kind !== 'NullableType' &&
//       !expectedArg.defaultValue &&
//       !actualArgNames.has(expectedArg.name.value)
//     ) {
//       return throwGraphQlError(
//         `Missing required parameter, "${expectedArg.name.value}", for field ${selection.name.value} on ${type.name.value}`,
//         {node: selection},
//       );
//     }
//   }

//   // TODO: check passed args are valid
//   const expectedArgs = new Map(field.arguments.map((a) => [a.name.value, a]));
//   for (const actualArg of selection.arguments) {
//     const expectedArg = expectedArgs.get(actualArg.name.value);
//     if (!expectedArg) {
//       return throwGraphQlError(
//         `Unexpected parameter, "${actualArg.name.value}", for field ${selection.name.value} on ${type.name.value}`,
//         {node: actualArg},
//       );
//     }
//     validateAssignValue(actualArg.value, expectedArg.type, document, variables);
//   }

//   const objectType = getObjectForType(field.type, document);
//   if (objectType) {
//     if (!selection.selectionSet) {
//       return throwGraphQlError(
//         `Missing selection set for field ${selection.name.value} on ${type.name.value}`,
//         {node: selection},
//       );
//     }
//     validateSelectionSet(
//       selection.selectionSet,
//       objectType,
//       document,
//       variables,
//     );
//   } else if (selection.selectionSet) {
//     return throwGraphQlError(
//       `Unexpected selection set for field ${selection.name.value} on ${type.name.value}`,
//       {node: selection},
//     );
//   }
// }

// function getObjectForType(
//   type: types.TypeNode,
//   document: GraphQlDocument,
// ):
//   | null
//   | types.ObjectTypeDefinitionNode
//   | types.InterfaceTypeDefinitionNode
//   | types.UnionTypeDefinitionNode {
//   switch (type.kind) {
//     case 'BooleanType':
//     case 'FloatType':
//     case 'IdType':
//     case 'IntType':
//     case 'StringType':
//       return null;
//     case 'NullableType':
//       return getObjectForType(type.ofType, document);
//     case 'ListType':
//       return getObjectForType(type.ofType, document);
//     case 'Name': {
//       const t = document.getTypeX(type);
//       switch (t.kind) {
//         case 'ObjectTypeDefinition':
//         case 'UnionTypeDefinition':
//         case 'InterfaceTypeDefinition':
//           return t;
//         case 'EnumTypeDefinition':
//         case 'InputObjectTypeDefinition':
//         case 'ScalarTypeDefinition':
//           return null;
//         default:
//           return assertNever(t);
//       }
//     }
//     default:
//       return assertNever(type);
//   }
// }

// function toLocation(source: string, index: number) {
//   let remaining = index;
//   let line = 1;
//   for (const lineStr of source.split(`\n`)) {
//     if (lineStr.length < remaining) {
//       return {line, column: remaining};
//     } else {
//       line++;
//       remaining -= lineStr.length;
//     }
//   }
//   return undefined;
// }

// function formatError(
//   e: RawGraphQLError | {message: string; locations: undefined},
//   operationsString: string,
// ) {
//   if (e.locations && e.locations.length === 1) {
//     const [loc] = e.locations;
//     return (
//       e.message +
//       '\n\n' +
//       codeFrameColumns(operationsString, {
//         start: {
//           line: loc.line,
//           column: loc.column,
//         },
//       }) +
//       '\n'
//     );
//   } else {
//     return e.message;
//   }
// }

// function formatNodeError({
//   operationsString,
//   message,
//   node,
// }: {
//   operationsString: string;
//   message: string;
//   node: {loc?: {start: number; end: number}};
// }) {
//   if (node.loc) {
//     const start = toLocation(operationsString, node.loc.start);
//     const end = toLocation(operationsString, node.loc.end);
//     if (start) {
//       return (
//         message +
//         '\n\n' +
//         codeFrameColumns(operationsString, {
//           start,
//           end,
//         }) +
//         '\n'
//       );
//     }
//   }
//   return message;
// }

// function validateAssignValue(
//   value: types.ValueNode,
//   type: types.TypeNode,
//   document: GraphQlDocument,
//   variables: ReadonlyMap<string, types.VariableDefinitionNode>,
// ): void {
//   if (value.kind === 'Variable') {
//     const variable = variables.get(value.name.value);
//     if (!variable) {
//       return throwGraphQlError(`Missing variable ${value.name.value}`, {
//         node: value.name,
//       });
//     }
//     validateAssignType(variable.type, type);
//     return;
//   }
//   if (type.kind === 'NullableType') {
//     if (
//       value.kind === 'NullValue' ||
//       (value.kind === 'JavaScriptValue' && value.value === null)
//     ) {
//       return;
//     }
//     validateAssignValue(value, type.ofType, document, variables);
//     return;
//   }
//   if (value.kind === 'NullValue') {
//     return throwGraphQlError(`Cannot assign null to ${type.kind}`, {
//       node: value,
//     });
//   }
//   if (type.kind === 'Name') {
//     const t = document.getInputTypeX(type);
//     switch (t.kind) {
//       case 'ScalarTypeDefinition':
//         break;
//       case 'EnumTypeDefinition': {
//         if (value.kind !== 'EnumValue') {
//           return throwGraphQlError(
//             `Cannot assign ${value.kind} to enum value`,
//             {
//               node: value,
//             },
//           );
//         }
//         if (!t.values.some((v) => value.value === v.name.value)) {
//           return throwGraphQlError(
//             `"${value.value}" is not a valid value in the ${t.name.value} enum.`,
//             {node: value},
//           );
//         }
//         break;
//       }
//       case 'InputObjectTypeDefinition':
//         if (value.kind !== 'ObjectValue') {
//           return throwGraphQlError(
//             `Cannot assign ${value.kind} to object value`,
//             {
//               node: value,
//             },
//           );
//         }
//         // TODO: check fields
//         break;
//       default:
//         return assertNever(t);
//     }
//     return;
//   }
//   switch (value.kind) {
//     case 'BooleanValue':
//       if (type.kind !== 'BooleanType') {
//         return throwGraphQlError(`Cannot assign boolean to ${type.kind}`, {
//           node: value,
//         });
//       }
//       break;
//     case 'FloatValue':
//       if (type.kind !== 'FloatType') {
//         return throwGraphQlError(`Cannot assign Float to ${type.kind}`, {
//           node: value,
//         });
//       }
//       break;
//     case 'IntValue':
//       if (
//         type.kind !== 'IntType' &&
//         type.kind !== 'FloatType' &&
//         type.kind !== 'IdType'
//       ) {
//         return throwGraphQlError(`Cannot assign int to ${type.kind}`, {
//           node: value,
//         });
//       }
//       break;
//     case 'StringValue':
//       if (type.kind !== 'StringType' && type.kind !== 'IdType') {
//         return throwGraphQlError(`Cannot assign string to ${type.kind}`, {
//           node: value,
//         });
//       }
//       break;
//     case 'ListValue':
//       if (type.kind !== 'ListType') {
//         return throwGraphQlError(`Cannot assign list to ${type.kind}`, {
//           node: value,
//         });
//       }
//       for (const v of value.values) {
//         validateAssignValue(v, type.ofType, document, variables);
//       }
//       break;

//     case 'JavaScriptValue':
//       validateAssignJsValue(value, type, document);
//       break;
//     case 'ObjectValue':
//     case 'EnumValue':
//       return throwGraphQlError(`Cannot assign } to ${type.kind}`, {
//         node: value,
//       });

//     default:
//       assertNever(value);
//   }
// }

// function validateAssignJsValue(
//   value: types.JavaScriptValueNode,
//   type: types.TypeNode,
//   document: GraphQlDocument,
// ): void {
//   const v = value.value;
//   switch (type.kind) {
//     case 'BooleanType':
//       if (typeof v !== 'boolean') {
//         throwGraphQlError(`Cannot assign ${typeof v} to Boolean value`, {
//           node: value,
//         });
//       }
//       break;
//     case 'FloatType':
//       if (typeof v !== 'number') {
//         throwGraphQlError(`Cannot assign ${typeof v} to Float value`, {
//           node: value,
//         });
//       }
//       break;
//     case 'IntType':
//       if (typeof v !== 'number') {
//         throwGraphQlError(`Cannot assign ${typeof v} to Int value`, {
//           node: value,
//         });
//       }
//       break;
//     case 'IdType':
//       if (typeof v !== 'number' && typeof v !== 'string') {
//         throwGraphQlError(`Cannot assign ${typeof v} to ID value`, {
//           node: value,
//         });
//       }
//       break;
//     case 'StringType':
//       if (typeof v !== 'string') {
//         throwGraphQlError(`Cannot assign ${typeof v} to String value`, {
//           node: value,
//         });
//       }
//       break;
//     case 'NullableType':
//       if (v !== null) {
//         validateAssignJsValue(value, type.ofType, document);
//       }
//       break;
//     case 'ListType':
//       if (!Array.isArray(v)) {
//         throwGraphQlError(`Cannot assign ${typeof v} to List value`, {
//           node: value,
//         });
//       }
//       for (const item of v) {
//         validateAssignJsValue({...value, value: item}, type.ofType, document);
//       }
//       break;
//     case 'Name': {
//       const t = document.getInputTypeX(type);
//       switch (t.kind) {
//         case 'EnumTypeDefinition':
//           if (!t.values.some((enumValue) => enumValue.name.value === v)) {
//             throwGraphQlError(`Cannot assign ${v} to enum ${t.name.value}`, {
//               node: value,
//             });
//           }
//           break;
//         case 'InputObjectTypeDefinition':
//           if (typeof v !== 'object') {
//             throwGraphQlError(`Cannot assign ${typeof v} to Object value`, {
//               node: value,
//             });
//           }
//           // TODO: check fields
//           break;
//         case 'ScalarTypeDefinition':
//           break;
//         default:
//           return assertNever(t);
//       }
//       break;
//     }
//     // : types.NameNode
//     default:
//       assertNever(type);
//   }
// }
// function validateAssignType(fromType: types.TypeNode, toType: types.TypeNode) {
//   switch (toType.kind) {
//     case 'BooleanType':
//       if (fromType.kind !== 'BooleanType') {
//         throwGraphQlError(`Cannot assign ${fromType.kind} to Boolean value`, {
//           node: fromType,
//         });
//       }
//       break;
//     case 'FloatType':
//       if (fromType.kind !== 'FloatType') {
//         throwGraphQlError(`Cannot assign ${fromType.kind} to Float value`, {
//           node: fromType,
//         });
//       }
//       break;
//     case 'IntType':
//       if (fromType.kind !== 'IntType') {
//         throwGraphQlError(`Cannot assign ${fromType.kind} to Int value`, {
//           node: fromType,
//         });
//       }
//       break;
//     case 'IdType':
//       if (fromType.kind !== 'IdType') {
//         throwGraphQlError(`Cannot assign ${fromType.kind} to ID value`, {
//           node: fromType,
//         });
//       }
//       break;
//     case 'StringType':
//       if (fromType.kind !== 'StringType') {
//         throwGraphQlError(`Cannot assign ${fromType.kind} to String value`, {
//           node: fromType,
//         });
//       }
//       break;
//     case 'NullableType':
//       validateAssignType(
//         fromType.kind === 'NullableType' ? fromType.ofType : fromType,
//         toType.ofType,
//       );

//       break;
//     case 'ListType':
//       if (fromType.kind !== 'ListType') {
//         throwGraphQlError(`Cannot assign ${fromType.kind} to List value`, {
//           node: fromType,
//         });
//       }
//       validateAssignType(fromType.ofType, toType.ofType);
//       break;
//     case 'Name': {
//       if (fromType.kind !== 'Name') {
//         throwGraphQlError(
//           `Cannot assign ${fromType.kind} to ${toType.value} value`,
//           {
//             node: fromType,
//           },
//         );
//       }
//       if (fromType.value !== toType.value) {
//         throwGraphQlError(
//           `Cannot assign ${fromType.value} to ${toType.value} value`,
//           {
//             node: fromType,
//           },
//         );
//       }
//       break;
//     }
//     default:
//       assertNever(toType);
//   }
// }

function getLocation(
  e: RawGraphQLError | {message: string; locations: undefined},
  {
    operationsString,
    filename,
  }: {operationsString: string; filename: string | undefined},
): types.Location {
  const source: types.LocationSource = filename
    ? {kind: 'FileLocationSource', filename, source: operationsString}
    : {kind: 'StringLocationSource', source: operationsString};

  if (e.locations && e.locations.length === 1) {
    const [loc] = e.locations;
    const position = errors.lineAndColumnToIndex(operationsString, loc);
    if (position) return {kind: 'LocationRange', source, start: position};
  }

  return source;
}
