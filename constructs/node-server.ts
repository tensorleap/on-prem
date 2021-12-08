import { Construct } from 'constructs';
import { Chart, Helm } from 'cdk8s';
import {
  IntOrString,
  KubeDeployment,
  KubeIngress,
  KubeRole,
  KubeRoleBinding,
  KubeService,
  KubeServiceAccount,
  PolicyRule,
} from '../imports/k8s';

export interface NodeServerProps {
  imageTag: string;
}

export class NodeServer extends Chart {
  constructor(scope: Construct, props: NodeServerProps) {
    super(scope, 'node-server', {
      labels: {
        app: 'node-server',
      },
    });

    new MongoDB(this, 'mongodb');

    const { serviceAccount } = new KubeServiceAccountWithRole(
      this,
      'node-server-sa',
      {
        rules: [
          {
            apiGroups: ['batch'],
            resources: ['jobs'],
            verbs: ['list', 'get', 'create', 'delete'],
          },
          {
            apiGroups: [''],
            resources: ['configmaps'],
            verbs: ['get'],
          },
        ],
      }
    );

    new KubeDeployment(this, 'deployment', {
      metadata: {
        name: 'node-server',
      },
      spec: {
        selector: {
          matchLabels: {
            app: 'node-server',
          },
        },
        template: {
          metadata: {
            labels: {
              app: 'node-server',
              revision: props.imageTag,
            },
          },
          spec: {
            serviceAccountName: serviceAccount.name,
            containers: [
              {
                name: 'node-server',
                image: `gcr.io/tensorleap/node-server:${props.imageTag}`,
                imagePullPolicy: 'Always',
                ports: [
                  {
                    name: 'http',
                    containerPort: 4000,
                  },
                ],
                env: [
                  {
                    name: 'NODE_ENV',
                    value: 'production',
                  },
                  {
                    name: 'KIBANA_URL',
                    value: 'http://kibana.default:5601',
                  },
                  {
                    name: 'MONGO_URI',
                    value:
                      'mongodb://mongodb.default.svc/tensorleap?tls=false&ssl=false',
                  },
                  {
                    name: 'NAMESPACE',
                    valueFrom: {
                      fieldRef: {
                        fieldPath: 'metadata.namespace',
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    });

    const service = new KubeService(this, 'service', {
      metadata: {
        name: 'node-server',
      },
      spec: {
        ports: [
          {
            name: 'http',
            port: 80,
            targetPort: IntOrString.fromString('http'),
          },
        ],
        selector: {
          app: 'node-server',
        },
        sessionAffinity: 'None',
        type: 'NodePort',
      },
    });

    new KubeIngress(this, 'ingress', {
      metadata: {
        annotations: {
          'kubernetes.io/ingress.class': 'public',
        },
        name: 'node-server',
      },
      spec: {
        rules: [
          {
            http: {
              paths: [
                {
                  backend: {
                    service: {
                      name: service.name,
                      port: { name: 'http' },
                    },
                  },
                  pathType: 'ImplementationSpecific',
                  path: '/api',
                },
                {
                  backend: {
                    service: {
                      name: service.name,
                      port: { name: 'http' },
                    },
                  },
                  pathType: 'ImplementationSpecific',
                  path: '/kibana',
                },
                {
                  backend: {
                    service: {
                      name: 'kibana',
                      port: { number: 5601 },
                    },
                  },
                  pathType: 'ImplementationSpecific',
                  path: '/kibana/bundles',
                },
                {
                  backend: {
                    service: {
                      name: 'kibana',
                      port: { number: 5601 },
                    },
                  },
                  pathType: 'ImplementationSpecific',
                  path: '/kibana/built_assets',
                },
                {
                  backend: {
                    service: {
                      name: service.name,
                      port: { name: 'http' },
                    },
                  },
                  pathType: 'ImplementationSpecific',
                  path: '/socket.io',
                },
              ],
            },
          },
        ],
      },
    });
  }
}
interface KubeServiceAccountWithRoleProps {
  rules: PolicyRule[];
}
export class KubeServiceAccountWithRole extends Chart {
  constructor(
    scope: Construct,
    id: string,
    props: KubeServiceAccountWithRoleProps
  ) {
    super(scope, id);

    this.serviceAccount = new KubeServiceAccount(this, id, {
      metadata: {
        name: id,
      },
      imagePullSecrets: [
        {
          name: 'gcr-access-token',
        },
      ],
    });

    const role = new KubeRole(this, `${id}-role`, {
      metadata: {
        name: `${id}-role`,
      },
      rules: props.rules,
    });

    new KubeRoleBinding(this, `${id}-role-binding`, {
      metadata: {
        name: `${id}-role-binding`,
      },
      roleRef: {
        apiGroup: role.apiGroup,
        kind: role.kind,
        name: role.name,
      },
      subjects: [
        {
          kind: this.serviceAccount.kind,
          name: this.serviceAccount.name,
          namespace: this.serviceAccount.metadata.namespace || 'default',
        },
      ],
    });
  }

  serviceAccount: KubeServiceAccount;
}

export class MongoDB extends Chart {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      namespace: 'default',
    });

    new Helm(this, 'mongodb', {
      chart: 'bitnami/mongodb',
      values: {
        fullnameOverride: 'mongodb',
        auth: {
          enabled: false,
        },
      },
      helmFlags: [
        '--version=9.3.1',
        `--namespace=${this.namespace || 'default'}`,
      ],
    });
  }
}