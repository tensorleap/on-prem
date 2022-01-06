import { Construct } from 'constructs';
import { Chart } from 'cdk8s';
import {
  KubeConfigMap,
  KubePersistentVolumeClaim,
  Quantity,
} from '../imports/k8s';
import * as yaml from 'js-yaml';

export interface EngineProps {
  imageTag: string;
  minioAddress: string;
}

export class Engine extends Chart {
  constructor(scope: Construct, props: EngineProps) {
    super(scope, 'engine', {
      labels: {
        app: 'engine',
      },
    });

    const pvc = new KubePersistentVolumeClaim(this, 'pvc', {
      metadata: {
        name: 'engine-pvc',
      },
      spec: {
        accessModes: ['ReadWriteMany'],
        resources: {
          requests: {
            storage: Quantity.fromString('250Gi'),
          },
        },
      },
    });

    new EngineConfigMap(this, 'cpu', {
      suffix: 'svcs',
      imageTag: props.imageTag,
      minioAddress: props.minioAddress,
      pvcClaimName: pvc.name,
    });

    new EngineConfigMap(this, 'gpu', {
      suffix: 'k80',
      imageTag: props.imageTag,
      minioAddress: props.minioAddress,
      pvcClaimName: pvc.name,
      gpu: true,
    });
  }
}

interface EngineConfigMapProps {
  suffix: string;
  imageTag: string;
  minioAddress: string;
  pvcClaimName: string;
  gpu?: boolean;
}

class EngineConfigMap {
  constructor(scope: Construct, id: string, props: EngineConfigMapProps) {
    const job = {
      metadata: {
        labels: {
          engineJob: 'true',
          suffix: props.suffix,
        },
      },
      spec: {
        template: {
          spec: {
            containers: [
              {
                image: `gcr.io/tensorleap/engine:${props.imageTag}`,
                name: 'engine',
                resources: props.gpu
                  ? { limits: { 'nvidia.com/gpu': 1 } }
                  : undefined,
                env: [
                  {
                    name: 'JOB_PAYLOAD',
                  },
                  {
                    name: 'PY_CONFIG',
                    value: '/app/config/config.yaml',
                  },
                  {
                    name: 'ELASTIC_HOST',
                    value: 'http://elasticsearch-master.default:9200',
                  },
                  {
                    name: 'SESSION_BUCKET',
                    value: 'session',
                  },
                  {
                    name: 'RABBIT_HOST',
                    value: 'rabbitmq-headless.default',
                  },
                  { name: 'RABBIT_USER', value: 'user' },
                  {
                    name: 'RABBIT_PASSWORD',
                    value: '3e3abae2-6325-11ec-90d6-0242ac120003',
                  },
                  { name: 'FEEDBACK_TOPIC', value: 'feedback' },
                  { name: 'SUBSCRIBER_TOPIC', value: 'job-control-channel' },
                  { name: 'STORAGE_PROVIDER', value: 'minio' },
                  {
                    name: 'STORAGE_ENDPOINT',
                    value: props.minioAddress,
                  },
                  {
                    name: 'HMAC_ACCESS_KEY_ID',
                    valueFrom: {
                      secretKeyRef: {
                        name: 'minio-secret',
                        key: 'rootUser',
                      },
                    },
                  },
                  {
                    name: 'HMAC_ACCESS_KEY_SECRET',
                    valueFrom: {
                      secretKeyRef: {
                        name: 'minio-secret',
                        key: 'rootPassword',
                      },
                    },
                  },
                ],
                volumeMounts: [
                  {
                    name: 'engine-pvc',
                    mountPath: '/nfs/',
                  },
                ],
              },
            ],
            restartPolicy: 'Never',
            volumes: [
              {
                name: 'engine-pvc',
                presistentVolumeClaim: {
                  claimName: props.pvcClaimName,
                },
              },
            ],
          },
        },
      },
    };

    new KubeConfigMap(scope, id, {
      metadata: {
        name: `engine-job-template-pytop-${props.suffix}`,
      },
      data: {
        job: yaml.dump(job),
      },
    });
  }
}
