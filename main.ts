import { App } from 'cdk8s';
import { WebUi } from './constructs/web-ui';
import { NodeServer } from './constructs/node-server';
import { Elasticsearch } from './constructs/elasticsearch';
import { Kibana } from './constructs/kibana';

const app = new App();
new Elasticsearch(app);
new Kibana(app);
new NodeServer(app, {
  imageTag: 'master-8b98feef-stable',
});
new WebUi(app, {
  imageTag: 'master-36b486b3-stable',
});
app.synth();
