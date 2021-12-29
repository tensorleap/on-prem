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
new Minio(app);
new RabbitMQ(app);
new NodeServer(app, {
  imageTag: 'master-695f8f96-stable',
});
new Engine(app, {
  imageTag: 'master-9df38ba7-stable',
});
new WebUi(app, {
  imageTag: 'master-81fdf920-stable',
});
app.synth();
