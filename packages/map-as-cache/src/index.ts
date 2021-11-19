export type Cache<TKey, TValue> = (
  key: TKey,
  load: () => Exclude<TValue, undefined>,
) => Exclude<TValue, undefined>;

export default function asCache<TKey, TValue>(cache: {
  get: (key: TKey) => Exclude<TValue, undefined> | undefined;
  set: (key: TKey, value: Exclude<TValue, undefined>) => unknown;
}): Cache<TKey, TValue>;
export default function asCache<TKey, TValue, TSerializedKey>(
  cache: {
    get: (key: TSerializedKey) => Exclude<TValue, undefined> | undefined;
    set: (key: TSerializedKey, value: Exclude<TValue, undefined>) => unknown;
  },
  serializeKey: (key: TKey) => TSerializedKey,
): Cache<TKey, TValue>;
export default function asCache<TKey, TValue, TSerializedKey>(
  cache: {
    get: (key: TKey | TSerializedKey) => Exclude<TValue, undefined> | undefined;
    set: (
      key: TKey | TSerializedKey,
      value: Exclude<TValue, undefined>,
    ) => unknown;
  },
  serializeKey: undefined | ((key: TKey) => TSerializedKey),
): Cache<TKey, TValue>;
export default function asCache<TKey, TValue, TSerializedKey = TKey>(
  cache: {
    get: (key: TSerializedKey) => Exclude<TValue, undefined> | undefined;
    set: (key: TSerializedKey, value: Exclude<TValue, undefined>) => unknown;
  },
  serializeKey?: (key: TKey) => TSerializedKey,
): Cache<TKey, TValue> {
  return (key, load) => {
    const sKey = serializeKey
      ? serializeKey(key)
      : ((key as any) as TSerializedKey);
    const cached = cache.get(sKey);
    if (cached !== undefined) return cached;
    const fresh = load();
    cache.set(sKey, fresh);
    return fresh;
  };
}
