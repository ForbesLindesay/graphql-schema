const {createHash} = require('crypto');
const {createReadStream} = require('fs');
const {readdir, stat, readFile, writeFile} = require('fs/promises');

async function listPackages() {
  const [packagesDir] = await Promise.all([
    readdir(`${__dirname}/../packages`),
  ]);
  return (
    await Promise.all(
      [...packagesDir.map((p) => `packages/${p}`), ...['scripts']].map((path) =>
        readFile(`${__dirname}/../${path}/package.json`, 'utf8').then(
          (content) => {
            return {path, ...JSON.parse(content)};
          },
          () => null,
        ),
      ),
    )
  ).filter(Boolean);
}

async function hashDependencies() {
  const hash = createHash(`sha512`);
  const [packages, yarnLock] = await Promise.all([
    listPackages(),
    readFile(`${__dirname}/../yarn.lock`),
  ]);
  hash.update(yarnLock);

  const packageNames = new Set(packages.map((p) => p.name));
  for (const pkg of packages) {
    hash.update(`${pkg.path}\n`);
    for (const prop of ['dependencies', 'devDependencies']) {
      hash.update(`${prop}\n`);
      for (const name of Object.keys(pkg[prop] || {})
        .filter((k) => packageNames.has(k))
        .sort()) {
        hash.update(`${name}\n`);
      }
    }
  }
  return hash;
}

async function hashTypeScriptFiles() {
  const packageDirectories = await updateTsConfig();
  const hash = createHash(`sha512`);

  await addFile(`yarn.lock`);
  await addFile(`package.json`);
  await addFile(`tsconfig.json`);
  for (const directory of packageDirectories) {
    await addFile(`${directory}/package.json`);
    await addFile(`${directory}/tsconfig.json`);
    await addDirectory(`${directory}/src`);
  }

  return hash;

  async function addDirectory(directory) {
    for (const entry of (await readdir(directory)).sort()) {
      const path = `${directory}/${entry}`;
      const entryStats = await stat(path);
      if (entryStats.isDirectory()) {
        await addDirectory(path);
      } else if (entryStats.isFile()) {
        await addFile(path);
      }
    }
  }
  async function addFile(path) {
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
}

async function updateTsConfig() {
  const packageDirectories = (await listPackages()).map((p) => p.path);

  const tsconfig = await readFile(`tsconfig.json`, `utf8`);

  const [before, ...afterParts] = tsconfig.split(`"references"`);
  const after = afterParts.join(`"references"`).split(`]`).slice(1).join(`]`);
  await writeFile(
    `tsconfig.json`,
    before +
      `"references": [\n${packageDirectories
        .map(
          (directory, i) =>
            `    {"path": ${JSON.stringify(`./${directory}`)}}${
              i !== packageDirectories.length - 1 ? `,` : ``
            }\n`,
        )
        .join(``)}  ]` +
      after,
  );

  return packageDirectories;
}

async function run(command) {
  switch (command) {
    case 'dependencies': {
      const hash = await hashDependencies();
      console.log(
        `::set-output name=dependencies_hash::${hash
          .digest('hex')
          .substring(0, 32)}`,
      );
      break;
    }
    case 'typescript': {
      const hash = await hashTypeScriptFiles();
      console.log(
        `::set-output name=typescript_hash::${hash
          .digest('hex')
          .substring(0, 32)}`,
      );
      break;
    }
    case 'tsconfig': {
      await updateTsConfig();
      break;
    }
  }
}

run(process.argv[2]).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});
