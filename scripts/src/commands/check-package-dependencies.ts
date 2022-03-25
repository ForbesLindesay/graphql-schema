import {promises as fs} from 'fs';
import {join, relative} from 'path';

import chalk from 'chalk';
import * as ask from 'interrogator';
import lsrAsync from 'lsr';
import {param, parse, startChain} from 'parameter-reducers';
import {format} from 'prettier';

import {diffObjects} from '../utils/diff';
import type {PackageRecord} from '../utils/packages';
import {getPackages} from '../utils/packages';

const isBuiltin = require('is-builtin-module');

export default async function packageDependencies(args: string[]) {
  const {fix = false} = parse(
    startChain().addParam(param.flag(['-f', '--fix'], 'fix')),
    args,
  ).extract();
  const packages = await getPackages();
  const checked = new Set<string>();
  const depVersions = new Map<string, Map<string, string[]>>();
  async function checkPackage(pkg: PackageRecord): Promise<void> {
    if (checked.has(pkg.manifest.name)) {
      return;
    }
    checked.add(pkg.manifest.name);

    const dependencies = new Set<string>();
    let foundSelfImport = false;
    await Promise.all(
      (await lsrAsync(join(pkg.dirname, `src`))).map(async (entry) => {
        if (
          entry.isFile() &&
          [`.ts`, `.tsx`].some((ext) => entry.name.endsWith(ext))
        ) {
          const src = await fs.readFile(entry.fullPath, `utf8`);
          try {
            let remaining = src;
            loop: while (remaining.length) {
              if (remaining.startsWith(`//`)) {
                const newlineIndex = remaining.indexOf(`\n`);
                remaining =
                  newlineIndex === -1 ? `` : remaining.substr(newlineIndex + 1);
                continue loop;
              }
              if (remaining.startsWith(`/*`)) {
                const endCommentIndex = remaining.indexOf(`*/`);
                remaining =
                  endCommentIndex === -1
                    ? ``
                    : remaining.substr(endCommentIndex + 2);
                continue loop;
              }
              for (const expr of [
                /^import\(\s*(?:\/\*[^*]+\*\/\s*)?['"`]([^{\n"'`]+)['"`]\s*\)/,
                /^import ['"]([^{\n"']+)['"]/,
                /^from ['"]([^{\n"']+)['"]/,
                /^require\(\s*(?:\/\*[^*]+\*\/\s*)?['"`]([^{\n"'`]+)['"`]\s*\)/,
              ]) {
                const match = expr.exec(remaining);
                if (match) {
                  if (!match[1].startsWith(`.`)) {
                    const pkgDependency = match[1]
                      .split(`/`)
                      .slice(0, match[1].startsWith(`@`) ? 2 : 1)
                      .join(`/`);
                    if (pkgDependency === pkg.manifest.name) {
                      console.error(
                        `${entry.path} imports "${pkgDependency}" but it is already inside "${pkg.manifest.name}". Use relative imports.`,
                      );
                      foundSelfImport = true;
                    }
                    dependencies.add(pkgDependency);
                  }
                  remaining = remaining.substr(match[0].length);
                  continue loop;
                }
              }
              remaining = remaining.substr(
                Math.min(
                  remaining.length,
                  ...[`import`, `from`, `require`, `//`, `/*`]
                    .map((str) => [str, remaining.indexOf(str)] as const)
                    .filter(([, i]) => i !== -1)
                    .map(([str, i]) => (i === 0 ? str.length : i)),
                ),
              );
              continue loop;
            }
          } catch (ex: any) {
            console.error(`Error parsing ${entry.fullPath}`);
            console.error(ex.stack);
            process.exit(1);
          }
        }
      }),
    );

    if (foundSelfImport) {
      return process.exit(1);
    }
    const pkgDependencies = new Set(
      [...dependencies]
        .filter((im) => !im.startsWith(`.`))
        .map((im) =>
          im
            .split(`/`)
            .slice(0, im.startsWith(`@`) ? 2 : 1)
            .join(`/`),
        ),
    );
    const missingDependencies = [...pkgDependencies]
      .filter(
        (d) =>
          !isBuiltin(d) &&
          !pkg.manifest.dependencies?.[d] &&
          !pkg.manifest.devDependencies?.[d] &&
          !d.includes('!'), // webpack inline-loaders like `import "file-loader!pdfjs-dist"`
      )
      .sort();
    if (missingDependencies.length) {
      const missingDependenciesObj = Object.fromEntries(
        await Promise.all(
          missingDependencies.map(async (depName) => {
            const localDep = packages.get(depName);
            if (localDep) {
              return [depName, `^0.0.0`] as const;
            } else {
              return [
                depName,
                await fs
                  .readFile(`node_modules/${depName}/package.json`, `utf8`)
                  .then(
                    (src) => `^${JSON.parse(src).version}`,
                    () => `UNKNOWN`,
                  ),
              ];
            }
          }),
        ),
      );
      console.error(
        `${chalk.magenta(
          pkg.manifest.name,
        )} is missing the following dependencies in ${relative(
          process.cwd(),
          join(pkg.dirname, `package.json`),
        )}:`,
      );
      console.error(``);
      console.error(
        JSON.stringify(missingDependenciesObj, null, `  `).replace(
          /"\n/g,
          `",\n`,
        ),
      );
      console.error(``);
      console.error(`Add them to either "dependencies" or "devDependencies"`);
      console.error(``);
      process.exit(1);
    }

    const references = [];
    for (const [dep, depVersion] of Object.entries({
      ...pkg.manifest.dependencies,
      ...pkg.manifest.devDependencies,
    }).sort()) {
      if (depVersion) {
        const currentDepVersions =
          depVersions.get(dep) || new Map<string, string[]>();
        depVersions.set(dep, currentDepVersions);
        const packagesWithCurrentDepVersion =
          currentDepVersions.get(depVersion) || [];
        currentDepVersions.set(depVersion, packagesWithCurrentDepVersion);
        packagesWithCurrentDepVersion.push(pkg.manifest.name);
      }

      const depPkg = packages.get(dep);
      if (depPkg) {
        await checkPackage(depPkg);
        references.push({path: relative(pkg.dirname, depPkg.dirname)});
      }
    }
    const referencesDiff = diffObjects({
      actual: pkg.tsConfig.references ?? [],
      expected: references,
    });
    if (!referencesDiff.equal) {
      if (fix) {
        const {references: oldReferences, ...otherTsConfig} = pkg.tsConfig;
        await fs.writeFile(
          join(pkg.dirname, `tsconfig.json`),
          format(
            JSON.stringify({
              ...otherTsConfig,
              ...(references.length ? {references} : {}),
            }),
            {parser: `json`, trailingComma: `all`},
          ),
        );
      } else {
        console.error(
          `References in tsconfig.json are out of date for ${pkg.manifest.name}`,
        );
        referencesDiff.printSummary();
        console.error(``);
        console.error(
          `You can fix this by running yarn m utils package-dependencies --fix`,
        );
        console.error(``);
        process.exit(1);
      }
    }
  }
  for (const pkg of packages.values()) {
    await checkPackage(pkg);
  }
  for (const [depName, versions] of depVersions) {
    if (versions.size > 1) {
      console.info(`There are multiple versions of ${depName} in this project`);
      console.info(versions);
      if (fix) {
        const newVersion = await ask.list(`Which version should we be using?`, [
          ...versions.keys(),
        ]);
        for (const [oldVersion, pkgNames] of versions) {
          if (oldVersion !== newVersion) {
            for (const pkgName of pkgNames) {
              const pkg = packages.get(pkgName);
              if (pkg) {
                await fs.writeFile(
                  join(pkg.dirname, `package.json`),
                  (await fs.readFile(join(pkg.dirname, `package.json`), `utf8`))
                    .split(
                      `${JSON.stringify(depName)}: ${JSON.stringify(
                        oldVersion,
                      )}`,
                    )
                    .join(
                      `${JSON.stringify(depName)}: ${JSON.stringify(
                        newVersion,
                      )}`,
                    ),
                );
              }
            }
          }
        }
      } else {
        console.info(`Run yarn m utils package-dependencies --fix to fix this`);
        process.exit(1);
      }
    }
  }
}
