import reuseSameFunctionImplementationAtEveryPath from './reuseSameFunctionImplementationAtEveryPath';

function mapNonNil<T, S>(
  value: T,
  map: (value: NonNullable<T>) => S,
): S | ExtractNull<T> {
  if (isNonNil(value)) {
    return map(value);
  } else {
    // @ts-expect-error
    return value;
  }
}
function isNonNil<T>(value: T): value is NonNullable<T> {
  return !(value === null || value === undefined);
}

type ExtractNull<T> = (null extends T ? null : never) &
  (undefined extends T ? undefined : never);

function isPromise<T>(value: Promise<T> | T): value is Promise<T> {
  return (
    value &&
    (typeof value === 'function' || typeof value === 'object') &&
    typeof (value as Promise<T>).then === 'function'
  );
}
function afterPromise<T, S>(
  value: Promise<T> | T,
  fn: (input: T) => Promise<S> | S,
): Promise<S> | S {
  return isPromise(value) ? value.then(fn) : fn(value);
}
export function isFieldValue<
  TNonFieldValue,
  TFieldValue extends FieldValue<any, any, any, any, any>
>(
  value: TNonFieldValue | TFieldValue,
): value is TFieldValue | Extract<TNonFieldValue, {public: Function}> {
  return value && 'asPublic' in value && typeof value.asPublic === 'function';
}

export interface FieldValue<TSource, TArgs, TContext, TResult, TFallback> {
  key<TKey extends keyof Exclude<TResult, null | undefined>>(
    key: TKey,
  ): FieldValue<
    TSource,
    TArgs,
    TContext,
    NonNullable<TResult>[TKey] | ExtractNull<TResult>,
    TFallback
  >;
  map<TMapResult>(
    fn: (
      value: NonNullable<TResult>,
      ctx: TContext,
    ) => Promise<TMapResult> | TMapResult,
  ): FieldValue<
    TSource,
    TArgs,
    TContext,
    TMapResult | ExtractNull<TResult>,
    TFallback
  >;
  mapArgs<TNewArgs, TMapResult>(
    fn: (
      value: NonNullable<TResult>,
      args: TNewArgs,
      ctx: TContext,
    ) => Promise<TMapResult> | TMapResult,
  ): FieldValue<
    TSource,
    TNewArgs & TArgs,
    TContext,
    TMapResult | ExtractNull<TResult>,
    TFallback
  >;

  notNull(
    msg: string,
  ): FieldValue<TSource, TArgs, TContext, NonNullable<TResult>, TFallback>;
  withDefault<TDefault>(
    value: TDefault,
  ): FieldValue<
    TSource,
    TArgs,
    TContext,
    NonNullable<TResult> | TDefault,
    TFallback
  >;

  asPublic(): FieldValueWithPermission<
    TSource,
    TArgs,
    TContext,
    TResult,
    TFallback
  >;
  requirePermission<TNewArgs, TNewFallback = never>(
    condition:
      | FieldValue<TSource, TNewArgs, TContext, boolean, boolean>
      | ((
          source: TSource,
          args: TNewArgs,
          context: TContext,
        ) => boolean | Promise<boolean>),
    fallback?:
      | FieldValue<TSource, TNewArgs, TContext, TNewFallback, TNewFallback>
      | ((
          source: TSource,
          args: TNewArgs,
          context: TContext,
        ) => TNewFallback | Promise<TNewFallback>),
  ): FieldValueWithPermission<
    TSource,
    TArgs & TNewArgs,
    TContext,
    TResult,
    TFallback | TNewFallback
  >;
}

export interface FieldValueWithPermission<
  TSource,
  TArgs,
  TContext,
  TResult,
  TFallback
> extends FieldValue<TSource, TArgs, TContext, TResult, TFallback> {
  (source: TSource, args: TArgs, context: TContext):
    | Promise<TResult | TFallback>
    | TResult
    | TFallback;
  handleAccessDenied<TNewFallback = never>(
    fallback:
      | FieldValue<TSource, TArgs, TContext, TNewFallback, TNewFallback>
      | ((
          source: TSource,
          args: TArgs,
          context: TContext,
        ) => TNewFallback | Promise<TNewFallback>),
  ): FieldValueWithPermission<TSource, TArgs, TContext, TResult, TNewFallback>;

  key<TKey extends keyof Exclude<TResult, null | undefined>>(
    key: TKey,
  ): FieldValueWithPermission<
    TSource,
    TArgs,
    TContext,
    NonNullable<TResult>[TKey] | ExtractNull<TResult>,
    TFallback
  >;
  map<TMapResult>(
    fn: (
      value: NonNullable<TResult>,
      ctx: TContext,
    ) => Promise<TMapResult> | TMapResult,
  ): FieldValueWithPermission<
    TSource,
    TArgs,
    TContext,
    TMapResult | ExtractNull<TResult>,
    TFallback
  >;
  mapArgs<TNewArgs, TMapResult>(
    fn: (
      value: NonNullable<TResult>,
      args: TNewArgs,
      ctx: TContext,
    ) => Promise<TMapResult> | TMapResult,
  ): FieldValueWithPermission<
    TSource,
    TNewArgs & TArgs,
    TContext,
    TMapResult | ExtractNull<TResult>,
    TFallback
  >;

  notNull(
    msg: string,
  ): FieldValueWithPermission<
    TSource,
    TArgs,
    TContext,
    NonNullable<TResult>,
    TFallback
  >;
  withDefault<TDefault>(
    value: TDefault,
  ): FieldValueWithPermission<
    TSource,
    TArgs,
    TContext,
    NonNullable<TResult> | TDefault,
    TFallback
  >;

  asPublic(): FieldValueWithPermission<
    TSource,
    TArgs,
    TContext,
    TResult,
    TFallback
  >;
  requirePermission<TNewArgs, TNewFallback = never>(
    condition:
      | FieldValue<TSource, TNewArgs, TContext, boolean, boolean>
      | ((
          source: TSource,
          args: TNewArgs,
          context: TContext,
        ) => boolean | Promise<boolean>),
    fallback?:
      | FieldValue<TSource, TNewArgs, TContext, TNewFallback, TNewFallback>
      | ((
          source: TSource,
          args: TNewArgs,
          context: TContext,
        ) => TNewFallback | Promise<TNewFallback>),
  ): FieldValueWithPermission<
    TSource,
    TArgs & TNewArgs,
    TContext,
    TResult,
    TNewFallback | TFallback
  >;
}

type AuthConditionResult<TFallback> =
  | Promise<
      {ok: true} | {ok: false; fallback: () => Promise<TFallback> | TFallback}
    >
  | {ok: true}
  | {ok: false; fallback: () => Promise<TFallback> | TFallback};

const AUTH_CONDITION_OK: {ok: true} = {ok: true};

function fieldValue<TSource, TArgs, TContext, TResult, TFallback>(
  fn: (
    source: TSource,
    args: TArgs,
    context: TContext,
  ) => Promise<TResult> | TResult,
  condition: (
    source: TSource,
    args: TArgs,
    context: TContext,
  ) => AuthConditionResult<TFallback>,
): FieldValueWithPermission<TSource, TArgs, TContext, TResult, TFallback> {
  type API = FieldValueWithPermission<
    TSource,
    TArgs,
    TContext,
    TResult,
    TFallback
  >;
  type ValueResolver<TValue, TNewArgs = TArgs> =
    | FieldValue<TSource, TNewArgs, TContext, TValue, TValue>
    | ((
        source: TSource,
        args: TNewArgs,
        context: TContext,
      ) => TValue | Promise<TValue>);

  const handleAccessDenied: API['handleAccessDenied'] = <TNewFallback>(
    fallback: ValueResolver<TNewFallback>,
  ) => {
    const f = isFieldValue(fallback) ? fallback.asPublic() : fallback;
    return fieldValue<TSource, TArgs, TContext, TResult, TNewFallback>(
      fn,
      (source, args, context) =>
        afterPromise(condition(source, args, context), (result) =>
          result.ok
            ? result
            : {ok: false, fallback: () => f(source, args, context)},
        ),
    );
  };
  const key: API['key'] = <TKey extends keyof NonNullable<TResult>>(
    key: TKey,
  ) =>
    fieldValue<
      TSource,
      TArgs,
      TContext,
      NonNullable<TResult>[TKey] | ExtractNull<TResult>,
      TFallback
    >(
      (source, args, context) =>
        afterPromise(fn(source, args, context), (parent) =>
          mapNonNil(parent, (p) => p[key]),
        ),
      condition,
    );

  const map: API['map'] = <TMapResult>(
    mapFn: (
      value: NonNullable<TResult>,
      ctx: TContext,
    ) => Promise<TMapResult> | TMapResult,
  ) =>
    fieldValue<
      TSource,
      TArgs,
      TContext,
      TMapResult | ExtractNull<TResult>,
      TFallback
    >((source, args, context) => {
      return afterPromise(fn(source, args, context), (parent) =>
        mapNonNil(parent, (p) => mapFn(p, context)),
      );
    }, condition);

  const mapArgs: API['mapArgs'] = <TNewArgs, TMapResult>(
    mapFn: (
      value: NonNullable<TResult>,
      args: TNewArgs,
      ctx: TContext,
    ) => Promise<TMapResult> | TMapResult,
  ) =>
    fieldValue<
      TSource,
      TNewArgs & TArgs,
      TContext,
      TMapResult | ExtractNull<TResult>,
      TFallback
    >(
      (source, args, context) =>
        afterPromise(fn(source, args, context), (parent) =>
          mapNonNil(parent, (p) => mapFn(p, args, context)),
        ),
      condition,
    );

  const notNull: API['notNull'] = (msg: string) =>
    fieldValue<TSource, TArgs, TContext, NonNullable<TResult>, TFallback>(
      (source, args, context) =>
        afterPromise(fn(source, args, context), (parent) => {
          if (isNonNil(parent)) return parent;
          throw new Error(msg);
        }),
      condition,
    );

  const withDefault: API['withDefault'] = <TDefaultValue>(
    defaultValue: TDefaultValue,
  ) =>
    fieldValue<
      TSource,
      TArgs,
      TContext,
      NonNullable<TResult> | TDefaultValue,
      TFallback
    >(
      (source, args, context) =>
        afterPromise(fn(source, args, context), (parent) => {
          if (isNonNil(parent)) return parent;
          return defaultValue;
        }),
      condition,
    );

  const asPublic: API['asPublic'] = () => fieldValue(fn, condition);

  const requirePermission: API['requirePermission'] = <
    TNewArgs,
    TNewFallback = never
  >(
    newCondition: ValueResolver<boolean, TNewArgs>,
    newConditionFallback: ValueResolver<TNewFallback, TNewArgs>,
  ) => {
    const c = isFieldValue(newCondition)
      ? newCondition.asPublic()
      : newCondition;
    const f = isFieldValue(newConditionFallback)
      ? newConditionFallback.asPublic()
      : newConditionFallback;
    return fieldValue<
      TSource,
      TArgs & TNewArgs,
      TContext,
      TResult,
      TNewFallback | TFallback
    >(fn, (source, args, context) =>
      afterPromise(
        condition(source, args, context),
        (oldConditionResult): AuthConditionResult<TNewFallback | TFallback> => {
          if (!oldConditionResult.ok) {
            return oldConditionResult;
          }
          return afterPromise(
            c(source, args, context),
            (
              newConditionResult,
            ): AuthConditionResult<TNewFallback | TFallback> => {
              if (newConditionResult === true) {
                return AUTH_CONDITION_OK;
              }
              return {ok: false, fallback: () => f(source, args, context)};
            },
          );
        },
      ),
    );
  };

  return Object.assign(
    (
      source: TSource,
      args: TArgs,
      context: TContext,
    ): Promise<TResult | TFallback> | TResult | TFallback =>
      afterPromise(condition(source, args, context), (conditionResult) =>
        conditionResult.ok === true
          ? fn(source, args, context)
          : conditionResult.fallback(),
      ),
    {
      handleAccessDenied,
      key,
      map,
      mapArgs,
      notNull,
      withDefault,
      asPublic,
      requirePermission,
    },
  );
}

const baseFieldHelper: FieldValue<any, unknown, any, any, never> & {
  resolvers: any;
} = Object.assign(
  fieldValue<any, unknown, any, any, never>(
    (v) => v,
    () => AUTH_CONDITION_OK,
  ),
  {
    resolvers: reuseSameFunctionImplementationAtEveryPath(
      <T>(value: T) => value,
    ),
  },
);
export function getHelpersForObject<
  TSource,
  TContext,
  TResolvers
>(): FieldValue<TSource, unknown, TContext, TSource, never> & {
  resolvers: ((resolvers: TResolvers) => TResolvers) &
    {[key in keyof TResolvers]: (resolver: TResolvers[key]) => TResolvers[key]};
} {
  return baseFieldHelper;
}

export function getHelpersForRootObject<TContext, TResolvers>(): {
  resolvers: ((resolvers: TResolvers) => TResolvers) &
    {[key in keyof TResolvers]: (resolver: TResolvers[key]) => TResolvers[key]};
  methods: {
    [key in keyof TResolvers]: TResolvers[key] extends (
      _source: any,
      args: infer TArgs,
      _ctx: any,
    ) => Promise<infer TResult> | infer TResult
      ? (
          resolver: (args: TArgs, ctx: TContext) => Promise<TResult> | TResult,
        ) => FieldValue<unknown, TArgs, TContext, TResult, never>
      : unknown;
  };
  asPublic: () => {
    [key in keyof TResolvers]: TResolvers[key] extends (
      _source: any,
      args: infer TArgs,
      _ctx: any,
    ) => Promise<infer TResult> | infer TResult
      ? (
          resolver: (args: TArgs, ctx: TContext) => Promise<TResult> | TResult,
        ) => FieldValueWithPermission<unknown, TArgs, TContext, TResult, never>
      : unknown;
  };
  requirePermission(
    condition: (context: TContext) => boolean | Promise<boolean>,
    fallback?: (context: TContext) => never | Promise<never>,
  ): {
    [key in keyof TResolvers]: TResolvers[key] extends (
      _source: any,
      args: infer TArgs,
      _ctx: any,
    ) => Promise<infer TResult> | infer TResult
      ? (
          resolver: (args: TArgs, ctx: TContext) => Promise<TResult> | TResult,
        ) => FieldValueWithPermission<unknown, TArgs, TContext, TResult, never>
      : unknown;
  };
} {
  return {
    resolvers: reuseSameFunctionImplementationAtEveryPath(
      <T>(value: T) => value,
    ),
    methods: reuseSameFunctionImplementationAtEveryPath(
      <TArgs, TResult>(
        resolver: (args: TArgs, ctx: TContext) => Promise<TResult> | TResult,
      ) =>
        fieldValue<unknown, TArgs, TContext, TResult, never>(
          (_, args, ctx) => resolver(args, ctx),
          () => AUTH_CONDITION_OK,
        ),
    ),
    asPublic: () =>
      reuseSameFunctionImplementationAtEveryPath(
        <TArgs, TResult>(
          resolver: (args: TArgs, ctx: TContext) => Promise<TResult> | TResult,
        ) =>
          fieldValue<unknown, TArgs, TContext, TResult, never>(
            (_, args, ctx) => resolver(args, ctx),
            () => AUTH_CONDITION_OK,
          ),
      ),
    requirePermission: (
      condition: (context: TContext) => boolean | Promise<boolean>,
      fallback: (context: TContext) => never | Promise<never> = () => {
        throw new Error('You do not have permission to access this method');
      },
    ) =>
      reuseSameFunctionImplementationAtEveryPath(
        <TArgs, TResult>(
          resolver: (args: TArgs, ctx: TContext) => Promise<TResult> | TResult,
        ) =>
          fieldValue<unknown, TArgs, TContext, TResult, never>(
            (_source, args, ctx) => resolver(args, ctx),
            (_source, _args, ctx) =>
              afterPromise(
                condition(ctx),
                (newConditonResult): AuthConditionResult<never> => {
                  if (newConditonResult === true) {
                    return AUTH_CONDITION_OK;
                  }
                  return {ok: false, fallback: () => fallback(ctx)};
                },
              ),
          ),
      ),
  };
}
