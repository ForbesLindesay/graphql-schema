import {basename, dirname, relative, resolve} from 'path';
import {mkdirSync, writeFileSync} from 'fs';
import chalk from 'chalk';
import {startChain, param, parse} from 'parameter-reducers';
import {
  validateSchemaFile,
  GraphQLError,
} from '@graphql-schema/validate-schema';
import {
  buildEnumDeclarations,
  buildInputObjectDeclarations,
  buildInterfaceDeclarations,
  buildObjectDeclarations,
  buildScalarDeclarations,
  buildUnionDeclarations,
  getNamedTypes,
  getResolverTypes,
} from '@graphql-schema/build-typescript-declarations';
import readConfigFile, {
  ResolverTypesConfigSchema,
} from '@graphql-schema/config';
import {createOperation} from '../utils/watch';
import TypeScriptWriter from '@graphql-schema/typescript-writer';
import {
  buildArgTypes,
  buildResolverHelpers,
  buildResolverTypeDeclarations,
  buildResultTypes,
  buildScalarFactory,
  buildScalarTypesInterface,
} from '@graphql-schema/build-typescript-server-types';

const params = startChain()
  .addParam(param.string([`-c`, `--config`], 'configFileName'))
  .addParam(param.flag([`-w`, `--watch`], `enableWatchMode`));

export default async function generateTypes(args: string[]) {
  const {configFileName, enableWatchMode = false} = parse(
    params,
    args,
  ).extract();
  if (!configFileName) {
    console.error(
      `🚨 Missing the "--config" option. Please use "--config" to specify the name of the config file.`,
    );
    return 1;
  }

  return createOperation(
    dirname(configFileName),
    [basename(configFileName)],
    async () => {
      const config = readConfigFile(configFileName, ResolverTypesConfigSchema);
      const schemaFileName = resolve(configFileName, config.schema.filename);
      return [
        createOperation(
          dirname(schemaFileName),
          [basename(schemaFileName)],
          async () => {
            const {schema, source} = validateSchemaFile(schemaFileName, {
              isFederated: config.schema.federated ?? false,
            });
            const types = getNamedTypes(schema);
            const resolverTypes = getResolverTypes(types);
            console.log(
              chalk.green(
                `Successfully validated ${relative(
                  process.cwd(),
                  schemaFileName,
                )}`,
              ),
            );
            const resolverTypesFilename = resolve(
              schemaFileName,
              config.resolverTypes.filename,
            );
            mkdirSync(dirname(resolverTypesFilename), {recursive: true});

            const writer = new TypeScriptWriter();
            const output = config.resolverTypes;

            buildEnumDeclarations(types, {
              writer,
              config: output.enums,
            });
            buildScalarDeclarations(types, {
              writer,
              config: output.scalars,
            });
            buildInputObjectDeclarations(types, {
              writer,
              config: output.inputObjects,
            });

            buildUnionDeclarations(types, {writer});
            buildInterfaceDeclarations(types, {writer});
            buildObjectDeclarations(types, {writer, config: output.objects});

            buildScalarTypesInterface(types, {
              writer,
              config: output.scalarResolvers,
            });
            buildScalarFactory(types, {writer, config: output.scalarResolvers});

            buildArgTypes(resolverTypes, {writer, config: output.inputObjects});
            buildResultTypes(resolverTypes, {
              writer,
              config: output.objectResolvers,
            });

            buildResolverTypeDeclarations(resolverTypes, {
              writer,
              config: output.objectResolvers,
            });
            buildResolverHelpers(resolverTypes, {
              writer,
              config: output.objectResolvers,
            });

            writeFileSync(resolverTypesFilename, writer.toString());
            console.log(
              chalk.green(
                `Successfully generated ${relative(
                  process.cwd(),
                  resolverTypesFilename,
                )}`,
              ),
            );
            if (config.schemaOutput) {
              const schemaOutputFilename = resolve(
                schemaFileName,
                config.schemaOutput.filename,
              );
              mkdirSync(dirname(schemaOutputFilename), {recursive: true});
              writeFileSync(
                schemaOutputFilename,
                config.schemaOutput.template.split(`$schema`).join(source),
              );
              console.log(
                chalk.green(
                  `Successfully generated ${relative(
                    process.cwd(),
                    schemaOutputFilename,
                  )}`,
                ),
              );
            }

            if (!config.operations) {
              return undefined;
            }
            return config.operations.map((o) => {
              const operationSourceFilename = resolve(
                configFileName,
                o.filename,
              );
              return createOperation(
                dirname(operationSourceFilename),
                [basename(operationSourceFilename)],
                async () => {
                  const operationTypesOutputFilename = resolve(
                    operationSourceFilename,
                    o.output.filename,
                  );
                  mkdirSync(dirname(operationTypesOutputFilename), {
                    recursive: true,
                  });

                  const writer = new TypeScriptWriter();
                  const output = o.output;

                  buildEnumDeclarations(types, {
                    writer,
                    config: output.enums,
                  });
                  buildScalarDeclarations(types, {
                    writer,
                    config: output.scalars,
                  });
                  buildInputObjectDeclarations(types, {
                    writer,
                    config: output.inputObjects,
                  });

                  // TODO: generate types based on the operations
                },
                async (err) => {
                  if (err instanceof GraphQLError) {
                    console.error(err.message);
                    return 1;
                  }
                  throw err;
                },
              );
            });
          },
          async (err) => {
            if (err instanceof GraphQLError) {
              console.error(err.message);
              return 1;
            }
            throw err;
          },
        ),
      ];
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
