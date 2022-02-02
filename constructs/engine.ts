import { Construct } from 'constructs';
import { Chart } from 'cdk8s';
import {
  KubeConfigMap,
  KubePersistentVolume,
  KubePersistentVolumeClaim,
  KubeServiceAccount,
  Quantity,
} from '../imports/k8s';
import * as yaml from 'js-yaml';

export interface EngineProps {
  imageTag: string;
  minioAddress: string;
}

const LOCAL_USER_DATA_STORAGE_SITE = Quantity.fromString('100Gi');

export class Engine extends Chart {
  constructor(scope: Construct, props: EngineProps) {
    super(scope, 'engine', {
      labels: {
        app: 'engine',
      },
    });

    const localDataPvc = new KubePersistentVolumeClaim(
      this,
      'local-user-data-pvc',
      {
        metadata: {
          name: 'local-user-data',
        },
        spec: {
          storageClassName: '',
          accessModes: ['ReadOnlyMany'],
          resources: {
            requests: {
              storage: LOCAL_USER_DATA_STORAGE_SITE,
            },
          },
        },
      }
    );

    new KubePersistentVolume(this, 'local-user-data-pv', {
      metadata: {
        name: 'local-user-data',
      },
      spec: {
        capacity: {
          storage: LOCAL_USER_DATA_STORAGE_SITE,
        },
        accessModes: ['ReadOnlyMany'],
        hostPath: {
          path: '/tensorleap-data/',
        },
        claimRef: {
          apiVersion: 'v1',
          kind: 'PersistentVolumeClaim',
          name: localDataPvc.name,
          namespace: 'default',
        },
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
            storage: Quantity.fromString('20Gi'),
          },
        },
      },
    });

    const serviceAccount = new KubeServiceAccount(this, 'engine-sa', {
      metadata: {
        name: 'engine-sa',
      },
      imagePullSecrets: [
        {
          name: 'gcr-access-token',
        },
      ],
    });

    new EngineConfigMap(this, 'cpu', {
      suffix: 'svcs',
      imageTag: props.imageTag,
      minioAddress: props.minioAddress,
      serviceAccountName: serviceAccount.name,
      pvcClaimName: pvc.name,
      localDataPvcClaimName: localDataPvc.name,
    });

    new EngineConfigMap(this, 'gpu', {
      suffix: 'k80',
      imageTag: props.imageTag,
      minioAddress: props.minioAddress,
      serviceAccountName: serviceAccount.name,
      pvcClaimName: pvc.name,
      localDataPvcClaimName: localDataPvc.name,
      gpu: true,
    });
  }
}

interface EngineConfigMapProps {
  suffix: string;
  imageTag: string;
  minioAddress: string;
  serviceAccountName: string;
  pvcClaimName: string;
  localDataPvcClaimName: string;
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
            serviceAccount: props.serviceAccountName,
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
                    value: 'rabbitmq-headless',
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
                    name: 'STORAGE_PORT',
                    value: '9000',
                  },
                  {
                    name: 'CONTENT_BASE_URL',
                    value: '/session/',
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
                  {
                    name: 'local-user-data-pvc',
                    mountPath: '/tensorleap-data/',
                  },
                ],
              },
            ],
            restartPolicy: 'Never',
            volumes: [
              {
                name: 'engine-pvc',
                persistentVolumeClaim: {
                  claimName: props.pvcClaimName,
                },
              },
              {
                name: 'local-user-data-pvc',
                persistentVolumeClaim: {
                  claimName: props.localDataPvcClaimName,
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
