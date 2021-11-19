import chalk from 'chalk';

export default function help(_args: string[]) {
  console.log(`Available commands:`);
  console.log(
    ` - ${chalk.cyan(`validate-schema`)} - validate a GraphQL schema`,
  );
  return 0;
}
