import { Construct } from 'constructs';
import { Chart, Helm } from 'cdk8s';

export class Elasticsearch extends Chart {
  constructor(scope: Construct) {
    super(scope, 'elasticsearch', {
      labels: {
        app: 'elasticsearch-master',
      },
    });

    new Helm(this, 'elasticsearch', {
      chart: 'elastic/elasticsearch',
      values: {
        replicas: 1,
      },
      helmFlags: ['--version=7.6.1', '--skip-tests'],
    });
  }
}
