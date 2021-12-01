import { MyChart } from './main';
import { Testing } from 'cdk8s';

test('On-prem manifests', () => {
  const app = Testing.app();
  new MyChart(app, 'test-chart');
  const results = app.synthYaml();
  expect(results).toMatchSnapshot();
});
