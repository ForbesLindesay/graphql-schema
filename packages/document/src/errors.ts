import {codeFrameColumns} from '@babel/code-frame';
import assertNever from 'assert-never';

import type * as types from './types';

export function printGraphQlLocation(loc: types.Location): string {
  switch (loc.kind) {
    case 'FileLocationSource':
      return loc.filename;
    case 'SchemaLocationSource':
      return 'GraphQL Schema';
    case 'StringLocationSource':
      return 'GraphQL String';
    case 'LocationRange': {
      switch (loc.source.kind) {
        case 'StringLocationSource':
        case 'FileLocationSource': {
          const l = indexToLineAndColumn(loc.source.source, loc.start);
          if (!l) return printGraphQlLocation(loc.source);
          return `${printGraphQlLocation(loc.source)}(${l.line}:${l.column})`;
        }
        default:
          return printGraphQlLocation(loc.source);
      }
    }
    default:
      return assertNever(loc);
  }
}

export interface GraphQlError {
  message: string;
  readonly code: string;
  readonly originalMessage: string;
  readonly loc: types.Location;
  readonly errors: readonly GraphQlError[];
}

export function createGraphQlError(
  code: string,
  message: string,
  options: {
    readonly loc: types.Location;
    readonly errors?: readonly GraphQlError[];
  },
): GraphQlError {
  const props: Omit<GraphQlError, 'message'> = {
    code,
    originalMessage: message,
    loc: options.loc,
    errors: options.errors ?? [],
  };
  return Object.assign(
    new Error(`${printGraphQlLocation(options.loc)}: ${message}`),
    {
      __is_graphql_schema_error__: true,
      ...props,
    },
  );
}
export function throwGraphQlError(
  code: string,
  message: string,
  options: {
    readonly loc: types.Location;
    readonly errors?: readonly GraphQlError[];
  },
): never {
  throw createGraphQlError(code, message, options);
}

export function isGraphQlError(error: unknown): error is GraphQlError {
  return (
    typeof error === 'object' &&
    error !== null &&
    '__is_graphql_schema_error__' in error &&
    (error as any).__is_graphql_schema_error__ === true
  );
}

export function locationToSourceString(
  loc: types.Location,
): string | undefined {
  switch (loc.kind) {
    case 'LocationRange':
      return locationToSourceString(loc.source);
    case 'FileLocationSource':
    case 'StringLocationSource': {
      return loc.source;
    }
    default:
      return undefined;
  }
}
export function locationToLineAndColumn(
  loc: types.Location,
):
  | {
      start: {line: number; column: number};
      end?: {line: number; column: number};
    }
  | undefined {
  if (loc.kind !== 'LocationRange') return undefined;

  const source = locationToSourceString(loc);
  if (!source) return undefined;

  const start = indexToLineAndColumn(source, loc.start);
  const end =
    loc.end !== undefined ? indexToLineAndColumn(source, loc.end) : undefined;
  return start ? {start, end} : undefined;
}

export function indexToLineAndColumn(
  source: string,
  index: number,
): {line: number; column: number} | undefined {
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
export function lineAndColumnToIndex(
  source: string,
  loc: {line: number; column: number},
): number | undefined {
  let lineNumber = 0;
  let index = 0;
  for (const line of source.split('\n')) {
    if (lineNumber === loc.line) return index + loc.column;
    lineNumber++;
    index += line.length;
  }
  return undefined;
}

export enum ErrorFormat {
  json = 'json',
  oneline = 'oneline',
  pretty = 'pretty',
}
export function printGraphQlErrors(
  error: GraphQlError,
  format: ErrorFormat,
): string[] {
  if (error.errors.length) {
    return error.errors.flatMap((e) => printGraphQlErrors(e, format));
  }
  switch (format) {
    case ErrorFormat.json:
      return [
        JSON.stringify({
          code: error.code,
          message: error.originalMessage,
          filename:
            error.loc.kind === 'FileLocationSource'
              ? error.loc.filename
              : undefined,
          location: locationToLineAndColumn(error.loc),
        }),
      ];
    case ErrorFormat.oneline:
      return [
        `ERROR(${error.code}): ${printGraphQlLocation(error.loc)}: ${
          error.originalMessage
        }`,
      ];
    case ErrorFormat.pretty: {
      const source = locationToSourceString(error.loc);
      const location = locationToLineAndColumn(error.loc);
      return [
        `Error in ${printGraphQlLocation(error.loc)}`,
        ``,
        `  ${error.originalMessage}`,
        ...(source && location
          ? [
              ``,
              ...codeFrameColumns(source, location)
                .split(`\n`)
                .map((line) => `  ${line}`),
            ]
          : []),
        ``,
      ];
    }
  }
}
// export function formatError(message: string) {
//   return (
//     message +
//     '\n\n' +
//     codeFrameColumns(operationsString, {
//       start: {
//         line: loc.line,
//         column: loc.column,
//       },
//     }) +
//     '\n'
//   );
// }
