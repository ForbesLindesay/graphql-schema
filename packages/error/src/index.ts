export default class GraphqlError extends Error {
  public readonly code: string;
  constructor(code: string, message: string, options?: any) {
    super(message);

    this.name = 'GraphqlError';
    this.code = code;
    Object.assign(this, options);

    // Maintains proper stack trace (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
