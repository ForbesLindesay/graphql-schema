import {basename, dirname} from 'path';
import chalk from 'chalk';
import {startChain, param, parse} from 'parameter-reducers';
import {errors} from '@graphql-schema/document';
import {validateSchemaFile} from '@graphql-schema/validate-schema';
import {validateOperationsFile} from '@graphql-schema/validate-operations';
import {createOperation} from '../utils/watch';
import errorFormatParam, {
  DEFAULT_ERROR_FORMAT,
} from '../utils/errorFormatParam';

const params = startChain()
  .addParam(param.string([`-s`, `--schema`], 'schemaFileName'))
  .addParam(param.stringList([`-o`, `--operations`], `operationsFileNames`))
  .addParam(param.flag([`--federated`], `isFederated`))
  .addParam(param.flag([`-w`, `--watch`], `enableWatchMode`))
  .addParam(errorFormatParam);

export default async function validate(args: string[]) {
  const {
    schemaFileName,
    operationsFileNames = [],
    isFederated = false,
    enableWatchMode = false,
    errorFormat = DEFAULT_ERROR_FORMAT,
  } = parse(params, args).extract();
  if (!schemaFileName) {
    console.error(
      `🚨 Missing the "--schema" option. Please use "--schema" to specify the name of the schema file you would like to validate.`,
    );
    return 1;
  }

  return await createOperation(
    dirname(schemaFileName),
    [basename(schemaFileName)],
    async (_events) => {
      const {
        schema,
        document: schemaDocument,
      } = validateSchemaFile(schemaFileName, {isFederated});
      console.log(chalk.green(`Successfully validated ${schemaFileName}`));

      return operationsFileNames.map((opFileName) =>
        createOperation(
          dirname(opFileName),
          [basename(opFileName)],
          async (_events) => {
            validateOperationsFile(opFileName, {schema, schemaDocument});
          },
          async (err) => {
            if (errors.isGraphQlError(err)) {
              for (const line of errors.printGraphQlErrors(err, errorFormat)) {
                console.error(line);
              }
              return 1;
            }
            throw err;
          },
        ),
      );
    },
    async (err) => {
      if (errors.isGraphQlError(err)) {
        for (const line of errors.printGraphQlErrors(err, errorFormat)) {
          console.error(line);
        }
        return 1;
      }
      throw err;
    },
  ).start({watchEnabled: enableWatchMode});
}
