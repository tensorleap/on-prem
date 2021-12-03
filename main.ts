import { App } from 'cdk8s';
import { WebUi } from './constructs/web-ui';

const app = new App();
new WebUi(app, {
  imageTag: 'run-on-prem-77547f29-stable',
});
app.synth();
