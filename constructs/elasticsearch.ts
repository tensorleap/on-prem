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
        lifecycle: {
          postStart: {
            exec: {
              command: [
                'bash',
                '-c',

                `#!/bin/bash
set -euo pipefail;
while [[ "$(curl -s -o /dev/null -w '%{http_code}\n' -L 127.0.0.1:9200/_cluster/health?wait_for_status=yellow&timeout=5s)" != "200" ]]; do sleep 3; done

echo 'Setting zero-replicas index template';
curl 127.0.0.1:9200/_template/zero-replicas -s --fail -XPUT -H 'Content-Type: application/json' -d '${JSON.stringify(
                  {
                    index_patterns: ['*'],
                    settings: {
                      number_of_replicas: 0,
                    },
                  }
                )}'
`,
              ],
            },
          },
        },
        antiAffinity: 'soft',
        esJavaOpts: '-Dlog4j2.formatMsgNoLookups=true',
      },
      helmFlags: ['--version=7.6.1', '--skip-tests'],
    });
  }
}
