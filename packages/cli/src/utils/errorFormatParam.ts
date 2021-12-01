import {param, valid, invalid} from 'parameter-reducers';
import {errors} from '@graphql-schema/document';

export const DEFAULT_ERROR_FORMAT = errors.ErrorFormat.pretty;

const errorFormatParam = param.parsedString<'errorFormat', errors.ErrorFormat>(
  [`-f`, `--format`],
  `errorFormat`,
  (value, key) =>
    Object.values(errors.ErrorFormat).includes(value as errors.ErrorFormat)
      ? valid(value as errors.ErrorFormat)
      : invalid(
          `Expected ${key} to be one of: ${Object.values(
            errors.ErrorFormat,
          ).join(`, `)}`,
        ),
);

export default errorFormatParam;
