import {GraphQLScalarType} from 'graphql';
import {showError} from 'funtypes';
import getLiteralValue from './getLiteralValue';

export type ScalarParseResult<T> =
  | {
      readonly success: true;
      readonly value: T;
    }
  | {
      readonly success: false;
      readonly message: string;
    };
export type ScalarImplementation<T> =
  | ((value: unknown) => T)
  | {
      readonly safeParse: (x: any) => ScalarParseResult<T>;
      readonly safeSerialize: (x: T) => ScalarParseResult<unknown>;
    }
  | GraphQLScalarType;

export default function createScalarFactory<
  T extends {readonly [key in string]?: ScalarImplementation<any>}
>(descriptions: {readonly [key in keyof T]: string}) {
  return (
    implementations: T,
  ): {-readonly [key in keyof T]: GraphQLScalarType} => {
    const results: [string, GraphQLScalarType][] = Object.entries(
      implementations,
    ).map(([name, scalar]) => {
      if (scalar === undefined) {
        throw new Error(
          `The implementation of the scalar "${name}" is undefined`,
        );
      }
      if (scalar instanceof GraphQLScalarType) {
        return [name, scalar];
      }
      const serialize =
        typeof scalar === 'function'
          ? scalar
          : (value: unknown) => {
              const result = scalar.safeSerialize(value);
              if (result.success) {
                return result.value;
              } else {
                throw new TypeError(showError(result));
              }
            };
      const parse =
        typeof scalar === 'function'
          ? scalar
          : (value: unknown) => {
              const result = scalar.safeParse(value);
              if (result.success) {
                return result.value;
              } else {
                throw new TypeError(showError(result));
              }
            };
      return [
        name,
        new GraphQLScalarType({
          name,
          description: descriptions[name as keyof typeof descriptions],
          serialize(value) {
            return serialize(value);
          },
          parseValue(value) {
            return parse(value);
          },
          parseLiteral(literal, variables) {
            const value = getLiteralValue(literal, variables ?? null);
            return parse(value);
          },
        }),
      ];
    });

    // @ts-expect-error - TypeScript thinks we might be missing properties
    return Object.fromEntries(results);
  };
}
