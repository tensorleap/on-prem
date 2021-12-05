import { App } from 'cdk8s';
import { WebUi } from './constructs/web-ui';
import { Elasticsearch } from './constructs/elasticsearch';

const app = new App();
new WebUi(app, {
  imageTag: 'run-on-prem-77547f29-stable',
});
new Elasticsearch(app);
app.synth();
