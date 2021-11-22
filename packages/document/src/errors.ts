import assertNever from 'assert-never';
import type * as types from './types';

export function printGraphQlLocation(loc: types.Location): string {
  switch (loc.kind) {
    case 'FileLocationSource':
      return loc.filename;
    case 'SchemaLocationSource':
      return 'GraphQL Schema';
    case 'LocationRange': {
      switch (loc.source.kind) {
        case 'FileLocationSource': {
          const lines = loc.source.source.split(`\n`);
          let line = 1;
          let character = loc.start;
          for (const lineStr of lines) {
            if (character < lineStr.length + 1) {
              break;
            } else {
              line++;
              character -= lineStr.length + 1;
            }
          }

          return `${loc.source.filename}(${line}:${character})`;
        }
        default:
          return printGraphQlLocation(loc.source);
      }
    }
    default:
      return assertNever(loc);
  }
}

export function throwGraphQlError(
  message: string,
  options: {node: {loc: types.Location}; code?: string},
): never {
  throw Object.assign(
    new Error(`${printGraphQlLocation(options.node.loc)}: ${message}`),
    {
      code: options.code ?? 'GRAPHQL_ERROR',
      originalMessage: message,
      node: options.node,
    },
  );
}
