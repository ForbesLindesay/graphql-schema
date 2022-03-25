import {existsSync, readdirSync} from 'fs';
import {Steps} from 'github-actions-workflow-builder';
import {
  cache,
  checkout,
  setupNode,
} from 'github-actions-workflow-builder/actions';
import {interpolate} from 'github-actions-workflow-builder/expression';
import {
  env,
  github,
  secrets,
} from 'github-actions-workflow-builder/lib/context';

const NODE_VERSION = '14.17.3';

export function setup(): Steps {
  return ({add, run, when}) => {
    add(checkout());
    add(
      setupNode({
        nodeVersion: NODE_VERSION,
        registryUrl: `https://registry.npmjs.org`,
      }),
    );

    const {outputs} = run<{dependencies_hash: string}>(
      `Get hash of dependencies for cache key`,
      `node .github/deps dependencies`,
    );
    const dependenciesHash = outputs.dependencies_hash;
    const {cacheMiss} = add(
      cache({
        stepName: `Enable Yarn Cache`,
        paths: [
          'node_modules',
          'packages/*/node_modules',
          'scripts/node_modules',
        ],
        key: interpolate`v1-node-modules-${NODE_VERSION}-${dependenciesHash}`,
        restoreKeys: [],
      }),
    );
    when(cacheMiss, () => {
      run('yarn install', 'yarn install --ignore-optional --frozen-lockfile');
    });
  };
}

export function checkWorkflows(): Steps {
  return ({run}) => {
    run(`Check Workflows Are Updated`, `yarn update-workflows --check`);
  };
}

export function typecheckWithCache(): Steps {
  return ({run, add, when}) => {
    const {outputs} = run<{typescript_hash: string}>(
      `Get hash of TypeScript for cache key`,
      `node .github/deps typescript`,
    );
    const typeScriptHash = outputs.typescript_hash;
    const {cacheMiss} = add(
      cache({
        stepName: `Enable TypeScript Cache`,
        paths: ['packages/*/lib', 'scripts/lib'],
        key: interpolate`v1-type-check-${typeScriptHash}`,
        restoreKeys: [`v1-type-check`],
      }),
    );
    when(cacheMiss, () => {
      run('Build TypeScript', 'yarn build:ts');
    });
  };
}

export function lintWithCache(): Steps {
  return ({add, run, when}) => {
    const {outputs} = run<{typescript_hash: string}>(
      `Get hash of TypeScript for cache key`,
      `node .github/deps typescript`,
    );
    const typeScriptHash = outputs.typescript_hash;
    const {cacheMiss} = add(
      cache({
        stepName: `Enable Lint Cache`,
        paths: ['.lint_cache'],
        key: interpolate`v1-lint-${typeScriptHash}`,
        restoreKeys: [`v1-lint`],
      }),
    );
    when(cacheMiss, () => {
      run(
        'Check Package Dependencies',
        'node scripts/lib check-package-dependencies',
      );
      run('Lint', 'node scripts/lib lint');
    });
  };
}

export function runTests(): Steps {
  return ({run}) => {
    run(`Test`, `yarn test`);
  };
}

export function publish(mode: 'canary' | 'stable'): Steps {
  return ({run}) => {
    run(
      mode === `canary` ? `Publish Canary` : `Publish`,
      mode === `canary`
        ? `npx rollingversions publish --canary ${github.run_number}`
        : `npx rollingversions publish`,
      {
        env: {
          GITHUB_TOKEN: secrets.GITHUB_TOKEN,
          NODE_AUTH_TOKEN: secrets.NPM_TOKEN,
        },
      },
    );
  };
}
