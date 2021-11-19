#! /usr/bin/env node

import chalk from 'chalk';

const command = process.argv[2];
const args = process.argv.slice(3);

async function run(): Promise<number> {
  switch (command) {
    case `help`:
      return await (await import('./commands/help')).default(args);
    case `validate`:
      return await (await import('./commands/validate')).default(args);
    case `resolver-types`:
      return await (await import('./commands/generate-types')).default(args);
    default:
      await (await import('./commands/help')).default(process.argv.slice(2));
      return 1;
  }
}

run().then(
  (exitCode) => {
    process.exit(exitCode);
  },
  (ex) => {
    console.error(chalk.red(`🚨 Unexpected Error 🚨`));
    console.error(``);
    if (ex instanceof Error) {
      console.error(ex.stack);
    } else {
      console.error(`Non error was thrown:`, ex);
    }
    console.error(``);

    console.error(
      chalk.red(
        `There may be an error in your code, but we should have been able to give`,
      ),
    );
    console.error(
      chalk.red(
        `you something more helpful than this stack trace, so we consider that to`,
      ),
    );
    console.error(chalk.red(`be a bug in graphql-schema.`));
    console.error();
    console.error(
      chalk.red(
        `Please report this exception, ${chalk.bold.redBright(
          `including the entire stack trace above`,
        )}, using this link:`,
      ),
    );
    console.error();
    console.error(
      `  ${chalk.underline.cyan(
        `https://github.com/ForbesLindesay/graphql-schema/issues/new?assignees=&labels=bug&template=bug_report.md&title=bug%3A`,
      )}`,
    );
    console.error();
    console.error(
      chalk.green(
        `If possible, please also include the configuration and GraphQL schema you were using when you saw this error.`,
      ),
    );
    console.error();
  },
);
