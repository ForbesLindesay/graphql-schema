import assertNever from 'assert-never';

import type GraphQlDocument from './GraphQlDocument';
import type {
  OperationDefinitionNode,
  SelectionSetNode,
  FieldNode,
  ArgumentNode,
  VariableDefinitionNode,
  TypeNode,
  ValueNode,
  NullableTypeNode,
  InlineFragmentNode,
  SelectionNode,
  FragmentSpreadNode,
} from './types';

export type PrintMode = 'pretty' | 'concise';

export function printTypeNode(
  t: TypeNode,
  {document, mode}: {document: GraphQlDocument; mode: PrintMode},
): string {
  switch (t.kind) {
    case 'NullableType':
      return printNonNullableTypeNode(t.ofType, {document, mode});
    default:
      return `${printNonNullableTypeNode(t, {document, mode})}!`;
  }
}

function printNonNullableTypeNode(
  t: Exclude<TypeNode, NullableTypeNode>,
  {document, mode}: {document: GraphQlDocument; mode: PrintMode},
): string {
  switch (t.kind) {
    case 'BooleanType':
      return `Boolean`;
    case 'FloatType':
      return `Float`;
    case 'IdType':
      return `ID`;
    case 'IntType':
      return `Int`;
    case 'StringType':
      return `String`;
    case 'ListType':
      return `[${printTypeNode(t.ofType, {document, mode})}]`;
    case 'Name':
      return t.value;
    default:
      return assertNever(t);
  }
}

function printValueNode(
  v: ValueNode,
  {document, mode}: {document: GraphQlDocument; mode: PrintMode},
): string {
  switch (v.kind) {
    case 'BooleanValue':
      return v.value === true ? `true` : `false`;
    case 'EnumValue':
    case 'IntValue':
    case 'FloatValue':
      return v.value;
    case 'NullValue':
      return `null`;
    case 'StringValue':
    case 'JavaScriptValue':
      return JSON.stringify(v.value);
    case 'ListValue':
      return `[${v.values
        .map((v) => printValueNode(v, {document, mode}))
        .join(mode === 'concise' ? `,` : `, `)}]`;
    case 'ObjectValue':
      return `{${v.fields
        .map(
          (f) =>
            `${f.name.value}:${mode === 'concise' ? `` : ` `}${printValueNode(
              f.value,
              {
                document,
                mode,
              },
            )}`,
        )
        .join(mode === 'concise' ? `,` : `, `)}}`;
    case 'Variable':
      return v.name.value;
    default:
      return assertNever(v);
  }
}

export function printOperation(
  operation: OperationDefinitionNode,
  {document, mode}: {document: GraphQlDocument; mode: PrintMode},
) {
  return `${operation.operation}${
    operation.name ? ` ${operation.name.value}` : ``
  }${
    operation.variableDefinitions.length
      ? `(${operation.variableDefinitions
          .map((v) => printVariableDefinitionNode(v, {document, mode}))
          .join(` `)})`
      : ``
  }${mode === 'concise' ? '' : ` `}${printSelectionSet(operation.selectionSet, {
    prefix: ``,
    document,
    mode,
  })}`;
}

function printSelectionSet(
  selectionSet: SelectionSetNode,
  {
    prefix,
    document,
    mode,
  }: {prefix: string; document: GraphQlDocument; mode: PrintMode},
): string {
  const isShort =
    selectionSet.selections.length <= 3 &&
    selectionSet.selections.every((s) => s.kind === 'Field' && !s.selectionSet);
  const prettySeparator = isShort ? `, ` : `\n`;
  return [
    mode === 'concise' ? `{` : isShort ? ` {` : ` {\n`,
    sortSelectionForCompression(selectionSet, mode)
      .map((s, i, selections): string => {
        const ending =
          i + 1 < selections.length
            ? mode === 'concise'
              ? requiresSeparator(s, selections[i + 1])
                ? ``
                : `,`
              : prettySeparator
            : ``;

        switch (s.kind) {
          case 'Field': {
            return `${printFieldNode(s, {
              prefix: `${prefix}  `,
              document,
              mode,
            })}${ending}`;
          }
          case 'FragmentSpread':
            return `...${s.name.value}${ending}`;
          case 'InlineFragment':
            return `${printInlineFragment(s, {
              document,
              mode,
              prefix: `${prefix}  `,
            })}${ending}`;
          default:
            return assertNever(s);
        }
      })
      .map((s) => (mode === 'concise' || isShort ? s : `${prefix}  ${s}`))
      .join(``),
    mode === 'concise' ? `}` : isShort ? `}` : `\n${prefix}}`,
  ].join(``);
}

function requiresSeparator(before: SelectionNode, after: SelectionNode) {
  if (
    before.kind === 'Field' &&
    (before.selectionSet || before.arguments.length)
  ) {
    return false;
  }
  if (before.kind === 'InlineFragment' || after.kind === 'InlineFragment') {
    return false;
  }
  if (after.kind === 'FragmentSpread') {
    return false;
  }
  return true;
}

/**
 * Sort a selection set to maximize the possibility that separators can be omitted
 */
function sortSelectionForCompression(
  s: SelectionSetNode,
  mode: PrintMode,
): readonly SelectionNode[] {
  if (mode === 'pretty') return s.selections;

  const head: FieldNode[] = [];
  const normalFields: FieldNode[] = [];
  const inlineFragments: InlineFragmentNode[] = [];
  const tail: FragmentSpreadNode[] = [];
  for (const node of s.selections) {
    switch (node.kind) {
      case 'Field':
        if (node.selectionSet || node.arguments) {
          head.push(node);
        } else {
          normalFields.push(node);
        }
        break;
      case 'FragmentSpread':
        tail.push(node);
        break;
      case 'InlineFragment':
        inlineFragments.push(node);
        break;
      default:
        return assertNever(node);
    }
  }
  head.sort((a, b) => (a.alias.value < b.alias.value ? -1 : 1));
  normalFields
    .sort((a, b) => (a.alias.value < b.alias.value ? -1 : 1))
    .reverse();
  inlineFragments.reverse();
  tail.sort((a, b) => (a.name.value < b.name.value ? -1 : 1));
  const body: SelectionNode[] = [];
  if (head.length && normalFields.length) {
    body.push(normalFields.pop()!);
  }
  while (normalFields.length || inlineFragments.length) {
    if (inlineFragments.length) {
      body.push(inlineFragments.pop()!);
    }
    if (normalFields.length) {
      body.push(normalFields.pop()!);
    }
  }
  return [...head, ...body, ...tail];
}

function printFieldNode(
  f: FieldNode,
  {
    prefix,
    document,
    mode,
  }: {prefix: string; document: GraphQlDocument; mode: PrintMode},
): string {
  return [
    // name
    f.alias.value !== f.name.value
      ? `${f.alias.value}:${mode === 'concise' ? `` : ` `}`
      : ``,
    f.name.value,

    // arguments
    f.arguments.length
      ? `(${f.arguments
          .map((a) => printArgumentNode(a, {document, mode}))
          .join(mode === 'concise' ? `,` : `, `)})`
      : ``,

    // selection set
    f.selectionSet
      ? printSelectionSet(f.selectionSet, {prefix, document, mode})
      : ``,
  ].join(``);
}

function printVariableDefinitionNode(
  v: VariableDefinitionNode,
  {document, mode}: {document: GraphQlDocument; mode: PrintMode},
): string {
  return [
    `${v.variable.name.value}:`,
    printTypeNode(v.type, {document, mode}),
    ...(v.defaultValue
      ? [`=`, printValueNode(v.defaultValue, {document, mode})]
      : []),
  ].join(mode === 'concise' ? `` : ` `);
}

function printArgumentNode(
  a: ArgumentNode,
  {document, mode}: {document: GraphQlDocument; mode: PrintMode},
) {
  return `${a.name.value}:${mode === 'concise' ? ` ` : ``}${printValueNode(
    a.value,
    {
      document,
      mode,
    },
  )}`;
}

function printInlineFragment(
  f: InlineFragmentNode,
  {
    document,
    mode,
    prefix,
  }: {document: GraphQlDocument; mode: PrintMode; prefix: string},
) {
  const typeCondition = f.typeCondition
    ? `${mode === 'concise' ? `` : ` `}on ${f.typeCondition.value}`
    : ``;
  return `...${typeCondition}${printSelectionSet(f.selectionSet, {
    document,
    mode,
    prefix,
  })}`;
}
