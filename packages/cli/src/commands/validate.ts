import {basename, dirname} from 'path';
import chalk from 'chalk';
import {startChain, param, parse} from 'parameter-reducers';
import {
  validateSchemaFile,
  GraphQLError,
} from '@graphql-schema/validate-schema';
import {createOperation} from '../utils/watch';

const params = startChain()
  .addParam(param.string([`-s`, `--schema`], 'schema'))
  .addParam(param.flag([`--federated`], `isFederated`))
  .addParam(param.flag([`-w`, `--watch`], `enableWatchMode`));

export default async function validate(args: string[]) {
  const {schema, isFederated = false, enableWatchMode = false} = parse(
    params,
    args,
  ).extract();
  if (!schema) {
    console.error(
      `🚨 Missing the "--schema" option. Please use "--schema" to specify the name of the schema file you would like to validate.`,
    );
    return 1;
  }

  return await createOperation(
    dirname(schema),
    [basename(schema)],
    async (events) => {
      validateSchemaFile(schema, {isFederated});
      console.log(chalk.green(`Successfully validated ${schema}`));
      if (events) {
        console.log(`Watching for changes to the GraphQL schema`);
      }
    },
    async (err) => {
      if (err instanceof GraphQLError) {
        console.error(err.message);
        return 1;
      }
      throw err;
    },
  ).start({watchEnabled: enableWatchMode});
}
