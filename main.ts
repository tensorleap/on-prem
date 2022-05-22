import { App } from 'cdk8s';
import { KappRules } from './constructs/kapp-rules';
import { WebUi } from './constructs/web-ui';
import { NodeServer } from './constructs/node-server';
import { Engine } from './constructs/engine';
import { Elasticsearch } from './constructs/elasticsearch';
import { Kibana } from './constructs/kibana';
import { Minio } from './constructs/minio';
import { RabbitMQ } from './constructs/rabbitmq';

const noGpu = process.env.DISABLE_GPU == 'true';

const app = new App();
new KappRules(app);
new Elasticsearch(app);
new Kibana(app);
const minio = new Minio(app);
new RabbitMQ(app);
new NodeServer(app, {
  imageTag: 'master-cf3634bb-stable',
  minioAddress: minio.minioAddress,
});
new Engine(app, {
  imageTag: 'master-5042f5f9-stable',
  minioAddress: minio.minioAddress,
  noGpu,
});
new WebUi(app, {
  imageTag: 'master-b5a8e4e1-stable',
});
app.synth();
