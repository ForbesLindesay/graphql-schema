import {promises as fs} from 'fs';
import {join, resolve} from 'path';

import chalk from 'chalk';
import * as ft from 'funtypes';

const pkgSchema = ft.Intersect(
  ft.Record(ft.String, ft.Unknown),
  ft.Object({name: ft.String}),
  ft.Partial({
    version: ft.String,
    private: ft.Boolean,
    dependencies: ft.Record(ft.String, ft.String),
    devDependencies: ft.Record(ft.String, ft.String),
    peerDependencies: ft.Record(ft.String, ft.String),
    optionalDependencies: ft.Record(ft.String, ft.String),
    scripts: ft.Record(ft.String, ft.String),
  }),
);

const tsconfigSchema = ft.Intersect(
  ft.Record(ft.String, ft.Unknown),
  ft.Partial({
    include: ft.Array(ft.String),
    files: ft.Array(ft.String),
    references: ft.Array(ft.Object({path: ft.String})),
  }),
);

export type PkgManifest = ft.Static<typeof pkgSchema> & {
  [key: string]: unknown;
};
export type TsConfig = ft.Static<typeof tsconfigSchema> & {
  [key: string]: unknown;
};
export interface PackageRecord {
  readonly dirname: string;
  readonly manifest: PkgManifest;
  readonly tsConfig: TsConfig;
}

export async function getPackages() {
  const directories = [
    resolve(`scripts`),
    ...(
      await Promise.all(
        ['packages'].map(
          async (parentDir) =>
            await Promise.all(
              (await fs.readdir(parentDir))
                .map((dirname) => resolve(`${parentDir}/${dirname}`))
                .map(
                  async (dirname) =>
                    [
                      dirname,
                      await fs.stat(join(dirname, `package.json`)).then(
                        (s) => s.isFile(),
                        () => false,
                      ),
                    ] as const,
                ),
            ),
        ),
      )
    )
      .flat(1)
      .filter(([, pkgExists]) => pkgExists)
      .map(([directory]) => directory),
  ];
  const packageRecords = await Promise.all(
    directories.map(
      async (dirname): Promise<PackageRecord> => {
        const pkgSrc = await fs.readFile(join(dirname, `package.json`), `utf8`);
        let pkg: unknown;
        try {
          pkg = JSON.parse(pkgSrc);
        } catch (ex: any) {
          console.error(`Error parsing package.json for ${dirname}`);
          console.error(ex.message);
          return process.exit(1);
        }
        const parsedPkg = pkgSchema.safeParse(pkg);
        if (!parsedPkg.success) {
          console.error(`Error validating package.json for ${dirname}`);
          console.error(ft.showError(parsedPkg));
          return process.exit(1);
        }
        const tsconfigSrc = await fs
          .readFile(join(dirname, `tsconfig.json`), `utf8`)
          .catch(() => `{}`);
        let tsconfig: unknown;
        try {
          tsconfig = Function('', `return (\n${tsconfigSrc}\n)`)();
        } catch (ex: any) {
          console.error(`Error parsing tsconfig.json for ${dirname}`);
          console.error(ex.message);
          return process.exit(1);
        }
        const parsedTsConfig = tsconfigSchema.safeParse(tsconfig);
        if (!parsedTsConfig.success) {
          console.error(`Error validating package.json for ${dirname}`);
          console.error(ft.showError(parsedTsConfig));
          return process.exit(1);
        }
        return {
          dirname,
          manifest: parsedPkg.value,
          tsConfig: parsedTsConfig.value,
        };
      },
    ),
  );
  const packages = new Map<string, PackageRecord>();
  for (const pkg of packageRecords) {
    if (packages.has(pkg.manifest.name)) {
      throw new Error(`Duplicate package name ${pkg.manifest.name}`);
    }
    packages.set(pkg.manifest.name, pkg);
  }

  let shortestCycle: readonly string[] | undefined;

  for (const pkg of packages.values()) {
    checkPackage(pkg, []);
  }

  if (shortestCycle) {
    console.error(``);
    console.error(``);
    console.error(`${chalk.red(`Found circular dependency`)}:`);
    console.error(``);
    console.error(
      `  ${shortestCycle.map((dep) => chalk.magenta(dep)).join(` -> `)}`,
    );
    console.error(``);
    console.error(``);
    return process.exit(1);
  }

  return packages;

  function checkPackage(pkg: PackageRecord, parents: string[]) {
    const depParents = [...parents, pkg.manifest.name];
    if (parents.includes(pkg.manifest.name)) {
      if (!shortestCycle || depParents.length < shortestCycle.length) {
        shortestCycle = depParents;
      }
      return;
    }

    for (const dep of Object.keys({
      ...pkg.manifest.dependencies,
      ...pkg.manifest.devDependencies,
      ...pkg.manifest.peerDependencies,
      ...pkg.manifest.optionalDependencies,
    })) {
      const depPkg = packages.get(dep);
      if (depPkg) {
        checkPackage(depPkg, depParents);
      }
    }
  }
}
