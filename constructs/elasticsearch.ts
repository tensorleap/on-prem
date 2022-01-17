import { Construct } from 'constructs';
import { Chart, Helm } from 'cdk8s';
import * as yaml from 'js-yaml';

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
        sysctlInitContainer: {
          enabled: false,
        },
        esConfig: {
          'elasticsearch.yml': yaml.dump({
            'node.store.allow_mmap': false,
            'discovery.type': 'single-node',
          }),
        },
        extraEnvs: [
          {
            name: 'cluster.initial_master_nodes',
            value: '',
          },
        ],
        antiAffinity: 'soft',
        esJavaOpts: '-Xmx128m -Xms128m -Dlog4j2.formatMsgNoLookups=true',
        resources: {
          requests: {
            cpu: '100m',
            memory: '512M',
          },
          limits: {
            cpu: '1000m',
            memory: '512M',
          },
        },
      },
      helmFlags: ['--version=7.6.1', '--skip-tests'],
    });
  }
}
