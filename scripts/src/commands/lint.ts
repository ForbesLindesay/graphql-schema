import type {Hash} from 'crypto';
import {createHash} from 'crypto';
import {createReadStream} from 'fs';
import {readdir, readFile, stat, writeFile} from 'fs/promises';
import {relative, resolve} from 'path';
import {gunzipSync, gzipSync} from 'zlib';

import chalk from 'chalk';
import spawn from 'execa';
import {startChain, param, parse} from 'parameter-reducers';
import createThrottle from 'throat';

import type {PackageRecord} from '../utils/packages';
import {getPackages} from '../utils/packages';

const YARN_LOCK_FILENAME = resolve(`${__dirname}/../../../yarn.lock`);
const TS_LINT_RC_FILENAME = resolve(`${__dirname}/../../../.eslintrc-ts.js`);
const BASE_LINT_RC_FILENAME = resolve(`${__dirname}/../../../.eslintrc.js`);

interface PackageHash {
  source: string;
  definitions: string;
}
export default async function lint(args: string[]) {
  const {fix = false, clearCache = false} = parse(
    startChain()
      .addParam(param.flag(['-f', '--fix'], 'fix'))
      .addParam(param.flag([`-c`, `--clear-cache`], `clearCache`)),
    args,
  ).extract();

  const [cache, envHash, packages] = await Promise.all([
    readCache(),
    getEnvHash(),
    getPackages(),
  ]);
  const updatedCache = new Map<string, string>();

  const nameLength = Math.max(...[...packages.keys()].map((n) => n.length));
  const statusLength = Math.max(...[`ok`, `fail`].map((s) => s.length));

  const lintHashCache = new Map<string, Promise<PackageHash>>();
  const throttle = createThrottle(8);

  const results = await Promise.all(
    [...packages.values()].map(async (pkg) => await lintPackage(pkg)),
  );

  await writeCache(updatedCache);

  if (!results.every((r) => r === true)) {
    process.exit(1);
  }

  async function lintPackage(pkg: PackageRecord) {
    const name = pkg.manifest.name;
    const freshHashDigest = await getLintHash(pkg);

    const start = Date.now();

    const cachedHashDigest = clearCache ? null : cache.get(pkg.manifest.name);
    if (cachedHashDigest === freshHashDigest.source) {
      console.log(
        `${chalk.magenta(name.padEnd(nameLength, ` `))} ${chalk.green(
          `ok`.padEnd(statusLength, ` `),
        )} (from cache)`,
      );
      updatedCache.set(pkg.manifest.name, freshHashDigest.source);
      return true;
    }
    const result = await throttle(async () => {
      return await spawn(
        `yarn`,
        [
          `--silent`,
          `eslint`,
          ...(fix ? [`--fix`] : []),
          `--config`,
          relative(pkg.dirname, TS_LINT_RC_FILENAME),
          `--no-eslintrc`,
          `--ext`,
          `.ts,.tsx`,
          `src`,
        ],
        {reject: false, cwd: pkg.dirname},
      );
    });

    const end = Date.now();

    if (result.exitCode === 0) {
      console.log(
        `${chalk.magenta(name.padEnd(nameLength, ` `))} ${chalk.green(
          `ok`.padEnd(statusLength, ` `),
        )} ${chalk.yellow(`(${end - start}ms)`)}`,
      );
      if (!fix) {
        updatedCache.set(pkg.manifest.name, freshHashDigest.source);
      }
      return true;
    }

    console.log(``);
    console.log(
      `${chalk.magenta(name.padEnd(nameLength, ` `))} ${chalk.red(
        `fail`.padEnd(statusLength, ` `),
      )} (${end - start}ms)`,
    );
    console.log(``);
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    console.log(``);

    return false;
  }

  async function getLintHash(pkg: PackageRecord): Promise<PackageHash> {
    const cached = lintHashCache.get(pkg.manifest.name);
    if (cached) return await cached;
    const fresh = getLintHashUncached(pkg);
    lintHashCache.set(pkg.manifest.name, fresh);
    return await fresh;
  }

  async function getLintHashUncached(pkg: PackageRecord): Promise<PackageHash> {
    const dependenciesHash = envHash.copy();

    const allDeps = [
      ...new Set(
        ([
          `dependencies`,
          `devDependencies`,
          `peerDependencies`,
          `optionalDependencies`,
        ] as const).flatMap((prop) => Object.keys(pkg.manifest[prop] ?? {})),
      ),
    ].sort();
    for (const dependencyHash of await Promise.all(
      allDeps.map(async (name) => {
        const pkg = packages.get(name);
        if (pkg) {
          return await getLintHash(pkg);
        } else {
          return null;
        }
      }),
    )) {
      if (dependencyHash) {
        dependenciesHash.update(dependencyHash.definitions);
      }
    }

    const sourceHash = dependenciesHash.copy();
    const definitionsHash = dependenciesHash.copy();

    await Promise.all([
      addDirectory(`${pkg.dirname}/src`, sourceHash),
      addDirectory(`${pkg.dirname}/lib`, definitionsHash, (f) =>
        f.endsWith(`.d.ts`),
      ),
    ]);

    return {
      source: sourceHash.digest(`base64`),
      definitions: definitionsHash.digest(`base64`),
    };
  }

  async function addDirectory(
    directory: string,
    hash: Hash,
    filter?: (filename: string) => boolean,
  ) {
    for (const entry of (await readdir(directory)).sort()) {
      const path = `${directory}/${entry}`;
      const entryStats = await stat(path);
      if (entryStats.isDirectory()) {
        await addDirectory(path, hash);
      } else if (entryStats.isFile() && (!filter || filter(path))) {
        await addFile(path, hash);
      }
    }
  }
  async function addFile(path: string, hash: Hash) {
    hash.update(path);
    await new Promise((resolve, reject) => {
      createReadStream(path)
        .on(`data`, (data) => {
          hash.update(data);
        })
        .on(`error`, reject)
        .on(`end`, resolve);
    });
  }

  async function getEnvHash(): Promise<Pick<Hash, 'copy'>> {
    const envHash = createHash(`sha1`);
    await addFile(YARN_LOCK_FILENAME, envHash);
    await addFile(TS_LINT_RC_FILENAME, envHash);
    await addFile(BASE_LINT_RC_FILENAME, envHash);
    return envHash;
  }
  async function readCache(): Promise<Map<string, string>> {
    try {
      return new Map(
        JSON.parse(gunzipSync(await readFile(`.lint-cache`)).toString(`utf8`)),
      );
    } catch (ex: any) {
      if (ex.code === `ENOENT`) return new Map();
      throw ex;
    }
  }
  async function writeCache(cache: Map<string, string>) {
    await writeFile(`.lint-cache`, gzipSync(JSON.stringify([...cache])));
  }
}
