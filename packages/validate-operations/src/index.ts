import {codeFrameColumns} from '@babel/code-frame';
import {
  ArgumentNode,
  buildSchema,
  DocumentNode,
  FieldNode,
  FragmentDefinitionNode,
  GraphQLArgument,
  GraphQLError as RawGraphQLError,
  GraphQLField,
  GraphQLInputType,
  GraphQLInterfaceType,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLSchema,
  isListType,
  isNamedType,
  isNonNullType,
  isScalarType,
  OperationDefinitionNode,
  parse as parseOperations,
  SelectionNode,
  SelectionSetNode,
  Source,
  TypeNode,
  UnionTypeDefinitionNode,
  ValueNode,
  VariableDefinitionNode,
} from 'graphql';
import GraphQLError from '@graphql-schema/error';
import chalk from 'chalk';

export interface ValidateOperationsOptions {
  schema: GraphQLSchema;
  filename?: string;
}
export default function validateOperations(
  operationsString: string,
  options: ValidateOperationsOptions,
) {
  let document: DocumentNode;
  try {
    document = parseOperations(new Source(operationsString, options.filename));
  } catch (ex: any) {
    throw new GraphQLError(
      'GRAPH_OPERATIONS_SYNTAX_ERROR',
      (options.filename
        ? `${chalk.red(`GraphQL syntax error in`)} ${chalk.cyan(
            options.filename,
          )}${chalk.red(`:`)}\n\n`
        : chalk.red(`GraphQL syntax error:\n\n`)) +
        formatError(ex, operationsString),
      {source: operationsString, errors: [ex]},
    );
  }

  const anonymousOperations: OperationDefinitionNode[] = [];
  const operations = new Map<string, OperationDefinitionNode>();
  const fragments = new Map<string, FragmentDefinitionNode>();
  for (const definition of document.definitions) {
    switch (definition.kind) {
      case 'OperationDefinition':
        // export interface OperationDefinitionNode {
        //   readonly kind: 'OperationDefinition';
        //   readonly loc?: Location;
        //   readonly operation: OperationTypeNode;
        //   readonly name?: NameNode;
        //   readonly variableDefinitions?: ReadonlyArray<VariableDefinitionNode>;
        //   readonly directives?: ReadonlyArray<DirectiveNode>;
        //   readonly selectionSet: SelectionSetNode;
        // }
        if (definition.name) operations.set(definition.name.value, definition);
        else anonymousOperations.push(definition);
        break;
      case 'FragmentDefinition':
        // export interface FragmentDefinitionNode {
        //   readonly kind: 'FragmentDefinition';
        //   readonly loc?: Location;
        //   readonly name: NameNode;
        //   // Note: fragment variable definitions are experimental and may be changed
        //   // or removed in the future.
        //   readonly variableDefinitions?: ReadonlyArray<VariableDefinitionNode>;
        //   readonly typeCondition: NamedTypeNode;
        //   readonly directives?: ReadonlyArray<DirectiveNode>;
        //   readonly selectionSet: SelectionSetNode;
        // }
        fragments.set(definition.name.value, definition);
        break;
      default:
        throw new GraphQLError(
          'GRAPH_OPERATIONS_SYNTAX_ERROR',
          formatNodeError({
            message:
              (options.filename
                ? `${chalk.red(
                    `Unexpected declaration type for operations file in`,
                  )} ${chalk.cyan(options.filename)}${chalk.red(`: `)}`
                : chalk.red(
                    `Unexpected declaration type for operations file: `,
                  )) + definition.kind,
            operationsString,
            node: definition,
          }),
          {
            source: operationsString,
          },
        );
    }
  }

  return {anonymousOperations, operations, fragments, source: operationsString};
}

function toLocation(source: string, index: number) {
  let remaining = index;
  let line = 1;
  for (const lineStr of source.split(`\n`)) {
    if (lineStr.length < remaining) {
      return {line, column: remaining};
    } else {
      line++;
      remaining -= lineStr.length;
    }
  }
  return undefined;
}

function formatError(
  e: RawGraphQLError | {message: string; locations: undefined},
  operationsString: string,
) {
  if (e.locations && e.locations.length === 1) {
    const [loc] = e.locations;
    return (
      e.message +
      '\n\n' +
      codeFrameColumns(operationsString, {
        start: {
          line: loc.line,
          column: loc.column,
        },
      }) +
      '\n'
    );
  } else {
    return e.message;
  }
}

function formatNodeError({
  operationsString,
  message,
  node,
}: {
  operationsString: string;
  message: string;
  node: {loc?: {start: number; end: number}};
}) {
  if (node.loc) {
    const start = toLocation(operationsString, node.loc.start);
    const end = toLocation(operationsString, node.loc.end);
    if (start) {
      return (
        message +
        '\n\n' +
        codeFrameColumns(operationsString, {
          start,
          end,
        }) +
        '\n'
      );
    }
  }
  return message;
}

function validateFieldSelection(
  ctx: ValidationContext,
  field: GraphQLField<unknown, unknown>,
  selection: FieldNode,
) {
  field.args;
  selection.arguments;
}
function validateFieldArg(
  ctx: ValidationContext,
  param: GraphQLArgument,
  arg: ArgumentNode,
) {
  param.type;
  arg.value;
}
function validateValueAssignment(
  ctx: ValidationContext,
  type: GraphQLInputType,
  value: ValueNode | undefined,
) {
  if (value?.kind === 'Variable') {
    const variable = ctx.variables.get(value.name.value);
    if (!variable) {
      return {
        ok: false,
        message: formatNodeError({
          message: `The variable ${value.name.value} was not declared`,
          operationsString: ctx.operationsString,
          node: value,
        }),
      };
    }
    variable.type;
  }
  if (isNonNullType(type)) {
    if (value) {
    }
  }
  if (isScalarType(type)) {
    value.kind;
  }
  // | GraphQLScalarType
  // | GraphQLEnumType
  // | GraphQLInputObjectType
  // | GraphQLList<any>
  // | GraphQLNonNull<
  //     | GraphQLScalarType
  //     | GraphQLEnumType
  //     | GraphQLInputObjectType
  //     | GraphQLList<any>
}
function validateTypeAssignment(
  ctx: ValidationContext,
  type: GraphQLInputType,
  value: TypeNode,
  source: ValueNode,
): Result {
  if (isNonNullType(type)) {
    if (value.kind == 'NonNullType') {
      return validateTypeAssignment(ctx, type.ofType, value.type, source);
    } else {
      return {
        ok: false,
        message: formatNodeError({
          message: `Cannot assign nullable type ${typeNodeToString(
            value,
          )} to non-null type ${type.toString()}`,
          operationsString: ctx.operationsString,
          node: source,
        }),
      };
    }
  }
  switch (value.kind) {
    case 'NonNullType':
      return validateTypeAssignment(ctx, type, value.type, source);
    case 'ListType':
      if (isListType(type)) {
        return validateTypeAssignment(ctx, type.ofType, value.type, source);
      } else {
        return {
          ok: false,
          message: formatNodeError({
            message: `Cannot assign list type ${typeNodeToString(
              value,
            )} to non-list type ${type.toString()}`,
            operationsString: ctx.operationsString,
            node: source,
          }),
        };
      }
    case 'NamedType':
      if (isListType(type) || type.name !== value.name.value) {
        return {
          ok: false,
          message: formatNodeError({
            message: `Cannot assign type ${typeNodeToString(
              value,
            )} to type ${type.toString()}`,
            operationsString: ctx.operationsString,
            node: source,
          }),
        };
      } else {
        return {ok: true, value: undefined};
      }
  }
}
function typeNodeToString(type: TypeNode): string {
  switch (type.kind) {
    case 'NonNullType':
      return `${typeNodeToString(type.type)}!`;
    case 'NamedType':
      return type.name.value;
    case 'ListType':
      return `[${typeNodeToString(type.type)}]`;
  }
}
interface ValidationContext {
  operationsString: string;
  schema: ReadonlyMap<string, GraphQLNamedType>;
  variables: ReadonlyMap<string, VariableDefinitionNode>;
}
type Result<T = void> = SuccessResult<T> | ErrorResult;
interface SuccessResult<T> {
  ok: true;
  value: T;
}
interface ErrorResult {
  ok: false;
  message: string;
}
