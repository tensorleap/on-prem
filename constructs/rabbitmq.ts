import { Construct } from 'constructs';
import { Chart, Helm } from 'cdk8s';

export class RabbitMQ extends Chart {
  constructor(scope: Construct) {
    super(scope, 'rabbitmq', {
      labels: {
        app: 'rabbitmq-master',
      },
    });

    new Helm(this, 'rabbitmq', {
      chart: 'bitnami/rabbitmq',
      values: {
        fullnameOverride: 'rabbitmq',
        auth: {
          user: 'user',
          password: '3e3abae2-6325-11ec-90d6-0242ac120003',
          erlangCookie: '3e3abae2-6325-11ec-90d6-0242ac120003',
        },
      },
      helmFlags: [
        '--version=8.24.3',
        `--namespace=${this.namespace || 'default'}`,
      ],
    });
  }
}
