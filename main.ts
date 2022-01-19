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
  imageTag: 'master-ec40fe36-stable',
  minioAddress: minio.minioAddress,
});
new Engine(app, {
  imageTag: 'master-fad49dd1-stable',
  minioAddress: minio.minioAddress,
});
new WebUi(app, {
  imageTag: 'master-4a586a25-stable',
});
app.synth();
