import {readdirSync} from 'fs';

import * as ask from 'interrogator';

const SCRIPTS = readdirSync(`${__dirname}/commands`)
  .filter((filename) => filename.endsWith(`.js`))
  .map((filename) => filename.replace(/\.js$/, ''))
  .sort();

async function getCommand(
  args: readonly string[],
): Promise<[typeof SCRIPTS[number], readonly string[]]> {
  if (args.length && SCRIPTS.includes(args[0])) {
    return [args[0], args.slice(1)];
  } else {
    return [await ask.list(`Which command?`, SCRIPTS), args];
  }
}
async function run(args: readonly string[]) {
  const [command, commandArgs] = await getCommand(args);
  await require(`./commands/${command}`).default(commandArgs);
}
run(process.argv.slice(2)).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});
