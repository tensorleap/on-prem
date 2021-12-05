import { Testing } from 'cdk8s';
import { WebUi } from './constructs/web-ui';
import { Elasticsearch } from './constructs/elasticsearch';
import { Kibana } from './constructs/kibana';

test('Web UI', () => {
  const app = Testing.app();
  new WebUi(app, {
    imageTag: 'master-1234568-stable',
  });
  const results = app.synthYaml();
  expect(results).toMatchSnapshot();
});

test('Elasticsearch', () => {
  const app = Testing.app();
  new Elasticsearch(app);
  const results = app.synthYaml();
  expect(results).toMatchSnapshot();
});

test('Kibana', () => {
  const app = Testing.app();
  new Kibana(app);
  const results = app.synthYaml();
  expect(results).toMatchSnapshot();
});
