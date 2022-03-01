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
  imageTag: 'master-2aef48b9-stable',
  minioAddress: minio.minioAddress,
});
new Engine(app, {
  imageTag: 'master-01dcc42c-stable',
  minioAddress: minio.minioAddress,
  noGpu,
});
new WebUi(app, {
  imageTag: 'master-c6ecabf6-stable',
});
app.synth();
