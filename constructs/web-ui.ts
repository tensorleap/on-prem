import { Construct } from 'constructs';
import { Chart } from 'cdk8s';
import {
  KubeDeployment,
  KubeIngress,
  KubeService,
  KubeServiceAccount,
} from '../imports/k8s';

export interface WebUiProps {
  imageTag: string;
}

export class WebUi extends Chart {
  constructor(scope: Construct, props: WebUiProps) {
    super(scope, 'tensorleap-web-ui', {
      labels: {
        app: 'web-ui',
      },
    });

    const serviceAccount = new KubeServiceAccount(this, 'web-ui-sa', {
      metadata: {
        name: 'web-ui-sa',
      },
      imagePullSecrets: [
        {
          name: 'gcr-access-token',
        },
      ],
    });

    new KubeDeployment(this, 'deployment', {
      metadata: {
        name: 'tensorleap-web-ui',
      },
      spec: {
        selector: {
          matchLabels: {
            app: 'web-ui',
          },
        },
        template: {
          metadata: {
            labels: {
              app: 'web-ui',
              revision: props.imageTag,
            },
          },
          spec: {
            serviceAccountName: serviceAccount.name,
            containers: [
              {
                name: 'web-ui',
                image: `gcr.io/tensorleap/web-ui:${props.imageTag}`,
                imagePullPolicy: 'Always',
                ports: [
                  {
                    name: 'http',
                    containerPort: 8080,
                  },
                ],
                env: [
                  {
                    name: 'NODE_ENV',
                    value: 'production',
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
        name: 'tensorleap-web-ui',
      },
      spec: {
        selector: { app: 'web-ui' },
        ports: [
          {
            name: 'http',
            port: 8080,
          },
        ],
        sessionAffinity: 'None',
        type: 'NodePort',
      },
    });

    new KubeIngress(this, 'ingress', {
      metadata: {
        labels: {
          app: 'web-ui',
        },
        annotations: {
          'kubernetes.io/ingress.class': 'public',
        },
        name: 'tensorleap-web-ui',
      },
      spec: {
        defaultBackend: {
          service: {
            name: service.name,
            port: { name: 'http' },
          },
        },
      },
    });
  }
}
