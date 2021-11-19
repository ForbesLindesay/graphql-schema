import {GraphQLType, isListType, isNonNullType, isNamedType} from 'graphql';
import assertNever from 'assert-never';
import {getBuiltinType, isBuiltinType} from './builtins';

export interface TypeScriptTypeOptions {
  /**
   * Override a given sub-type. Useful for getting the type for
   * a query result.
   *
   * N.B. All types should be treated as `NonNull` in the override
   *      and you can return `null` or `undefined` to indicate you
   *      do not want to override a given type.
   */
  readonly getOverride?: (type: GraphQLType) => string | null | undefined;

  /**
   * Should arrays be marked as readonly
   *
   * @default false
   */
  readonly useReadonlyArrays?: boolean;

  /**
   * Allow `undefined` as alternative to `null`
   *
   * @default false
   */
  readonly allowUndefinedAsNull?: boolean;

  /**
   * Require parentheses around union types
   *
   * @default false
   */
  readonly requireParentheses?: boolean;
}

export default function getTypeScriptType(
  t: GraphQLType,
  options: TypeScriptTypeOptions,
): string {
  if (isNonNullType(t)) {
    return getTypeScriptTypeNotNull(t.ofType, options);
  }
  const notNullType = getTypeScriptTypeNotNull(t, {
    ...options,
    requireParentheses: false,
  });
  const nullType = options.allowUndefinedAsNull ? `null | undefined` : `null`;
  return parentheses(`${notNullType} | ${nullType}`, options);
}

export function getTypeScriptTypeNotNull(
  t: GraphQLType,
  options: TypeScriptTypeOptions,
): string {
  if (isNonNullType(t)) {
    return getTypeScriptTypeNotNull(t.ofType, options);
  }

  const override = options.getOverride ? options.getOverride(t) : null;
  if (override) {
    return override;
  }

  if (isListType(t)) {
    const mutableArray = `${getTypeScriptType(t.ofType, {
      ...options,
      requireParentheses: true,
    })}[]`;
    return options.useReadonlyArrays
      ? parentheses(`readonly ${mutableArray}`, options)
      : mutableArray;
  }

  if (isNamedType(t)) {
    if (isBuiltinType(t.name)) {
      return getBuiltinType(t.name);
    } else {
      return t.name;
    }
  }

  return assertNever(t);
}

function parentheses(str: string, options: TypeScriptTypeOptions) {
  return options.requireParentheses ? `(${str})` : str;
}
