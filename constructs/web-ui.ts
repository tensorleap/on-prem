import { Construct } from 'constructs';
import { Chart } from 'cdk8s';
import { KubeDeployment, KubeIngress, KubeService } from '../imports/k8s';

export interface WebUiProps {
  imageTag: string;
}

export class WebUi extends Chart {
  constructor(scope: Construct, id: string, props: WebUiProps) {
    super(scope, id);

    new KubeDeployment(this, 'deployment', {
      metadata: {
        labels: {
          app: 'web-ui',
        },
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
        labels: {
          app: 'web-ui',
        },
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
