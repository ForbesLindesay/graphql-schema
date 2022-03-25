import createWorkflow from 'github-actions-workflow-builder';
import {
  checkWorkflows,
  setup,
  typecheckWithCache,
  lintWithCache,
  runTests,
  publish,
} from './_shared';

export default createWorkflow(({setWorkflowName, addTrigger, addJob}) => {
  setWorkflowName('Publish Canary');

  addTrigger('push', {branches: ['main']});

  addJob('publish', ({add}) => {
    add(setup());
    add(checkWorkflows());
    add(typecheckWithCache());
    add(lintWithCache());
    add(runTests());
    add(publish('canary'));
  });
});
