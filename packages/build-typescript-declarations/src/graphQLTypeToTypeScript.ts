import assertNever from 'assert-never';

import type {types} from '@graphql-schema/document';

export interface TypeScriptTypeOptions {
  /**
   * Override a given sub-type. Useful for getting the type for
   * a query result.
   *
   * N.B. All types should be treated as `NonNull` in the override
   *      and you can return `null` or `undefined` to indicate you
   *      do not want to override a given type.
   */
  readonly getOverride?: (type: types.TypeNode) => string | null | undefined;

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
  t: types.TypeNode,
  options: TypeScriptTypeOptions,
): string {
  const override = options.getOverride?.(t);
  if (override != undefined) return override;

  switch (t.kind) {
    case 'NullableType': {
      const notNullType = getTypeScriptType(t.ofType, {
        ...options,
        requireParentheses: false,
      });
      const nullType = options.allowUndefinedAsNull
        ? `null | undefined`
        : `null`;
      return parentheses(`${notNullType} | ${nullType}`, options);
    }
    case 'ListType': {
      const mutableArray = `${getTypeScriptType(t.ofType, {
        ...options,
        requireParentheses: true,
      })}[]`;
      return options.useReadonlyArrays
        ? parentheses(`readonly ${mutableArray}`, options)
        : mutableArray;
    }
    case 'BooleanType':
      return 'boolean';
    case 'FloatType':
    case 'IntType':
      return 'number';
    case 'StringType':
    case 'IdType':
      return 'string';
    case 'Name':
      return t.value;
    default:
      return assertNever(t);
  }
}

function parentheses(str: string, options: TypeScriptTypeOptions) {
  return options.requireParentheses ? `(${str})` : str;
}
