import { App } from 'cdk8s';
import { KappRules } from './constructs/kapp-rules';
import { WebUi } from './constructs/web-ui';
import { NodeServer } from './constructs/node-server';
import { Engine } from './constructs/engine';
import { Elasticsearch } from './constructs/elasticsearch';
import { Kibana } from './constructs/kibana';
import { Minio } from './constructs/minio';
import { RabbitMQ } from './constructs/rabbitmq';

const app = new App();
new KappRules(app);
new Elasticsearch(app);
new Kibana(app);
const minio = new Minio(app);
new RabbitMQ(app);
new NodeServer(app, {
  imageTag: 'master-863ed9f4-stable',
  minioAddress: minio.minioAddress,
});
new Engine(app, {
  imageTag: 'master-453eeb77-stable',
  minioAddress: minio.minioAddress,
});
new WebUi(app, {
  imageTag: 'master-1919cf5b-stable',
});
app.synth();
