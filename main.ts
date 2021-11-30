import { Construct } from 'constructs';
import { App, Chart, ChartProps } from 'cdk8s';
import { WebUi } from './constructs/web-ui';

export class MyChart extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = {}) {
    super(scope, id, props);

    new WebUi(this, 'web-ui', {
      imageTag: 'run-on-prem-77547f29-stable',
    });
  }
}

const app = new App();
new MyChart(app, 'on-prem');
app.synth();
