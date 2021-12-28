import { Testing } from 'cdk8s';
import { WebUi } from './constructs/web-ui';
import { NodeServer } from './constructs/node-server';
import { Elasticsearch } from './constructs/elasticsearch';
import { Kibana } from './constructs/kibana';
import { Minio } from './constructs/minio';

test('Web UI', () => {
  const app = Testing.app();
  new WebUi(app, {
    imageTag: 'master-1234568-stable',
  });
  const results = app.synthYaml();
  expect(results).toMatchSnapshot();
});

test('NodeServer', () => {
  const app = Testing.app();
  new NodeServer(app, {
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

test('Minio', () => {
  const app = Testing.app();
  new Minio(app);
  const results = app.synthYaml();
  expect(results).toMatchSnapshot();
});
