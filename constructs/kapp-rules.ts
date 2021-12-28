import { Construct } from 'constructs';
import { ApiObject, Chart } from 'cdk8s';

export class KappRules extends Chart {
  constructor(scope: Construct) {
    super(scope, 'kapp-rules');

    new ApiObject(this, 'kapp-rules', {
      apiVersion: 'kapp.k14s.io/v1alpha1',
      kind: 'Config',
      rebaseRules: [
        {
          path: [
            'metadata',
            'annotations',
            'control-plane.alpha.kubernetes.io/leader',
          ],
          type: 'copy',
          sources: ['new', 'existing'],
          resourceMatchers: [
            {
              apiVersionKindMatcher: {
                apiVersion: 'v1',
                kind: 'PersistentVolumeClaim',
              },
            },
          ],
        },
      ],
    });
  }
}
