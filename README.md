# On Prem

## Installing microk8s
```
brew install ubuntu/microk8s/microk8s
microk8s install
microk8s enable ingress dns storage rbac
```

#### Authenticating to gcr.io
This example uses the ops account
```
gsutil cp gs://tensorleap-infra-nonprod/ops/default.tfstate - | jq -r '.resources[] | select(.name == "ops_key" and .type == "github_actions_organization_secret") | .instances[].attributes.plaintext_value' > ./json-key-file.json

kubectl --kubeconfig=<(microk8s config) create secret docker-registry gcr-access-token \
  --docker-server=gcr.io \
  --docker-username=_json_key \
  --docker-password="$(cat ./json-key-file.json)" \
  --docker-email=someone@tensorleap.ai
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

## Connecting to the cluster
```
$ multipass list
Name                    State             IPv4             Image
microk8s-vm             Running           192.168.64.2     Ubuntu 18.04 LTS
```
navigate to the ip of the host vm in the browser
