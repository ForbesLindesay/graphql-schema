// Lets you create a function/object where not matter what path you use,
// you are actually calling the same function.
// This is useful for generating type safe helpers by generating the types
// but using the same implementation everywhere.

export default function reuseSameFunctionImplementationAtEveryPath<T>(
  fn: any,
): T {
  const nestedFn: any = new Proxy(fn, {
    get() {
      return nestedFn;
    },
    has() {
      return true;
    },
    getOwnPropertyDescriptor() {
      return {
        value: nestedFn,
        writable: false,
        enumerable: false,
        configurable: false,
      };
    },
    set() {
      return false;
    },
    defineProperty() {
      return false;
    },
    deleteProperty() {
      return false;
    },
  });
  return nestedFn;
}
