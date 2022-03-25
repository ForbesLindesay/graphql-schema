import type Location from '../Location';

export default interface JavaScriptValueNode {
  readonly kind: 'JavaScriptValue';
  readonly loc: Location;
  readonly value: unknown;
}
