import { Construct } from 'constructs';
import { Chart, Helm } from 'cdk8s';

export class Kibana extends Chart {
  constructor(scope: Construct) {
    super(scope, 'kibana', {
      labels: {
        app: 'kibana',
      },
    });

    new Helm(this, 'kibana', {
      chart: 'elastic/kibana',
      values: {
        fullnameOverride: 'kibana',
        healthCheckPath: '/kibana/app/kibana',
        image: 'gcr.io/tensorleap/kibanimat',
        imageTag: 'master-3266eae8-stable',
        kibanaConfig: {
          'kibana.yml': `
            server:
              basePath: /kibana
              rewriteBasePath: true
              `,
        },
        elasticsearchHosts: 'http://elasticsearch-master.default:9200',
      },
      helmFlags: ['--version=7.6.1'],
    });
  }
}
