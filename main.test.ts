import { WebUi } from './constructs/web-ui';
import { Testing } from 'cdk8s';

test('Web UI', () => {
  const app = Testing.app();
  new WebUi(app, {
    imageTag: 'master-1234568-stable',
  });
  const results = app.synthYaml();
  expect(results).toMatchSnapshot();
});
