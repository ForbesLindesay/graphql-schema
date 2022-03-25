import {readFile} from 'fs/promises';

import {getPackages} from './packages';

export default async function getProductionDependencies(
  packageManifest: any,
  canInline: (packageName: string) => boolean,
) {
  const packages = await getPackages();

  const addedPackages = new Set<string>();
  const dependencies: [string, string][] = [];
  const addDependencies = async (deps: {
    [name: string]: string | undefined;
  }) => {
    for (const [name, version] of Object.entries(deps)) {
      if (!version || addedPackages.has(name)) continue;
      addedPackages.add(name);
      const localPackageRecord = packages.get(name);
      if (localPackageRecord) {
        await addDependencies(localPackageRecord.manifest.dependencies ?? {});
      } else if (canInline(name)) {
        await addDependencies(
          JSON.parse(
            await readFile(
              `${__dirname}/../../../node_modules/${name}/package.json`,
              `utf8`,
            ),
          ).dependencies ?? {},
        );
      } else if (!name.startsWith(`@types/`)) {
        dependencies.push([name, version]);
      }
    }
  };
  await addDependencies(packageManifest.dependencies);

  return Object.fromEntries(dependencies.sort(([a], [b]) => (a < b ? -1 : 1)));
}
