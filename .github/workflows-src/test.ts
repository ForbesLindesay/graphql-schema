import createWorkflow from 'github-actions-workflow-builder';
import {
  checkWorkflows,
  setup,
  typecheckWithCache,
  lintWithCache,
  runTests,
} from './_shared';

export default createWorkflow(({setWorkflowName, addTrigger, addJob}) => {
  setWorkflowName('Test');

  addTrigger('pull_request', {branches: ['main']});

  addJob('build', ({add, run}) => {
    add(setup());
    add(checkWorkflows());
    add(typecheckWithCache());
    add(lintWithCache());
    add(runTests());
  });
});
