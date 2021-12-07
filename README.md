# On Prem

## Installing microk8s
```
brew install ubuntu/microk8s/microk8s
microk8s install
microk8s enable ingress
```

## Deploying to local cluster
```
npm run build
kubectl --kubeconfig=<(microk8s config) apply -f ./dist
```

or with `kapp`:
```
kapp --kubeconfig=<(microk8s config) deploy -a on-prem -f ./dist
```

You can also avoid writing `--kubeconfig=<(microk8s config)` by running:
```
KUBECONFIG=<(microk8s config):$HOME/.kube/config kubectl config view --raw > kubeConfig && mv kubeConfig $HOME/.kube/config
```
You should now have `microk8s` visible in `kctx`
