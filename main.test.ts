import { Testing } from 'cdk8s';
import { WebUi } from './constructs/web-ui';
import { NodeServer } from './constructs/node-server';
import { Engine } from './constructs/engine';
import { Elasticsearch } from './constructs/elasticsearch';
import { Kibana } from './constructs/kibana';
import { Minio } from './constructs/minio';
import { KappRules } from './constructs/kapp-rules';
import { RabbitMQ } from './constructs/rabbitmq';

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
    minioAddress: 'dummy-minio',
  });
  const results = app.synthYaml();
  expect(results).toMatchSnapshot();
});

describe('Engine', () => {
  test('With GPU', () => {
    const app = Testing.app();
    new Engine(app, {
      imageTag: 'master-1234568-stable',
      minioAddress: 'dummy-minio',
    });
    const results = app.synthYaml();
    expect(results).toMatchSnapshot();
  });

  test('Without GPU', () => {
    const app = Testing.app();
    new Engine(app, {
      imageTag: 'master-1234568-stable',
      minioAddress: 'dummy-minio',
      noGpu: true,
    });
    const results = app.synthYaml();
    expect(results).toMatchSnapshot();
  });
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

test('Kapp Rules', () => {
  const app = Testing.app();
  new KappRules(app);
  const results = app.synthYaml();
  expect(results).toMatchSnapshot();
});

test('RabbitMQ', () => {
  const app = Testing.app();
  new RabbitMQ(app);
  const results = app.synthYaml();
  expect(results).toMatchSnapshot();
});
