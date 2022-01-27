import { Construct } from 'constructs';
import { Chart, Helm } from 'cdk8s';
import { KubeIngress, KubeSecret } from '../imports/k8s';

export class Minio extends Chart {
  public minioAddress: string;
  constructor(scope: Construct) {
    super(scope, 'minio', {
      labels: {
        app: 'minio',
      },
    });

    const minioSecreet = new KubeSecret(this, 'minio-secret', {
      metadata: {
        name: 'minio-secret',
      },
      data: {
        rootUser: Buffer.from('foobarbaz').toString('base64'),
        rootPassword: Buffer.from('foobarbazqux').toString('base64'),
      },
    });

    const minio = new Helm(this, 'minio', {
      chart: 'minio/minio',
      values: {
        mode: 'standalone',
        existingSecret: minioSecreet.name,
        service: {
          type: 'NodePort',
        },
        persistence: {
          size: '2Gi',
        },
        resources: {
          requests: {
            memory: '500Mi',
          },
        },
        buckets: [
          {
            name: 'session',
            policy: 'public',
          },
        ],
      },
      helmFlags: ['--version=3.4.3'],
    });

    new KubeIngress(this, 'ingress', {
      metadata: {
        annotations: {
          'nginx.ingress.kubernetes.io/proxy-body-size': '100m',
          'kubernetes.io/ingress.class': 'public',
          'nginx.ingress.kubernetes.io/upstream-vhost': `${minio.releaseName}:9000`,
        },
        name: 'minio',
      },
      spec: {
        rules: [
          {
            http: {
              paths: [
                {
                  backend: {
                    service: {
                      name: minio.releaseName,
                      port: { name: 'http' },
                    },
                  },
                  pathType: 'ImplementationSpecific',
                  path: '/session',
                },
              ],
            },
          },
        ],
      },
    });

    this.minioAddress = minio.releaseName;
  }
}
