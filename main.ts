import { App } from 'cdk8s';
import { WebUi } from './constructs/web-ui';
import { Elasticsearch } from './constructs/elasticsearch';
import { Kibana } from './constructs/kibana';

const app = new App();
new WebUi(app, {
  imageTag: 'master-36b486b3-stable',
});
new Elasticsearch(app);
new Kibana(app);
app.synth();
