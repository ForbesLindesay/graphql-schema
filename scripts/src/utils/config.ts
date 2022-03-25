import * as ask from 'interrogator';
import {invalid, param, valid} from 'parameter-reducers';

export const ENVIRONMENTS = ['staging', 'prod'] as const;
export const PROJECT_ID = `sw-timer-lock`;
export const REGION = `europe-west1`;
export const DOCKER_REPOSITORY = `timer-lock-docker`;

export const DOCKER_DOMAIN = `${REGION}-docker.pkg.dev`;
export const FULL_IMAGE_NAME = (name: string, tag: string) =>
  `${DOCKER_DOMAIN}/${PROJECT_ID}/${DOCKER_REPOSITORY}/${name}:${tag}`;

export const ENV_PARAM = param.parsedString(
  [`-e`, `--environment`],
  `environment`,
  (value) =>
    ENVIRONMENTS.includes(value as any)
      ? valid<typeof ENVIRONMENTS[number]>(value as any)
      : invalid(`--environment must be one of ${ENVIRONMENTS.join(', ')}`),
);
export async function getEnv(inputs: {
  environment?: typeof ENVIRONMENTS[number];
}) {
  return (
    inputs.environment ??
    (await ask.list('Which environment do you want to use?', ENVIRONMENTS))
  );
}
