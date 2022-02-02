import { Testing } from 'cdk8s';
import { WebUi } from './constructs/web-ui';
import { NodeServer } from './constructs/node-server';
import { Engine } from './constructs/engine';
import { Elasticsearch } from './constructs/elasticsearch';
import { Kibana } from './constructs/kibana';
import { Minio } from './constructs/minio';
import { KappRules } from './constructs/kapp-rules';
import { RabbitMQ } from './constructs/rabbitmq';

chartTest('Web UI', (app) => {
  new WebUi(app, {
    imageTag: 'master-1234568-stable',
  });
});

chartTest('NodeServer', (app) => {
  new NodeServer(app, {
    imageTag: 'master-1234568-stable',
    minioAddress: 'dummy-minio',
  });
});

describe('Engine', () => {
  chartTest('With GPU', (app) => {
    new Engine(app, {
      imageTag: 'master-1234568-stable',
      minioAddress: 'dummy-minio',
    });
  });

  chartTest('Without GPU', (app) => {
    new Engine(app, {
      imageTag: 'master-1234568-stable',
      minioAddress: 'dummy-minio',
      noGpu: true,
    });
  });
});

chartTest('Elasticsearch', (app) => {
  new Elasticsearch(app);
});

chartTest('Kibana', (app) => {
  new Kibana(app);
});

chartTest('Minio', (app) => {
  new Minio(app);
});

chartTest('Kapp Rules', (app) => {
  new KappRules(app);
});

chartTest('RabbitMQ', (app) => {
  new RabbitMQ(app);
});

function chartTest(
  testName: string,
  fn: (app: ReturnType<typeof Testing['app']>) => void
) {
  test(testName, () => {
    const app = Testing.app();
    fn(app);
    const results = app.synthYaml();
    expect(results).toMatchSnapshot();
  });
}
