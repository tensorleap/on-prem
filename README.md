# On Prem

## Installing microk8s and tensorleap from the repo

### On Mac

```bash
# install microk8s
brew install ubuntu/microk8s/microk8s
microk8s install
microk8s status --wait-ready
microk8s enable ingress dns storage rbac

# Add microk8s context to your local KubeConfig file
KUBECONFIG=<(microk8s config):$HOME/.kube/config kubectl config view --raw > kubeConfig && mv kubeConfig $HOME/.kube/config

# install kapp
brew tap vmware-tanzu/carvel
brew install kapp

# install helm and add repositories
brew install helm
helm repo add elastic https://helm.elastic.co
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add minio https://charts.min.io/

# Build manifests
npm install
DISABLE_GPU=true npm run build

## ========= MAKE SURE YOU'RE IN MICROK8S CONTEXT ===========
kubectx -c # => should print microk8s

# get ops service account secret and deploy it to microk8s cluster
gsutil cp gs://tensorleap-infra-nonprod/ops/default.tfstate - | jq -r '.resources[] | select(.name == "ops_key" and .type == "github_actions_organization_secret") | .instances[].attributes.plaintext_value' > ./json-key-file.json
kubectl --kubeconfig=<(microk8s config) create secret docker-registry gcr-access-token \
  --docker-server=gcr.io \
  --docker-username=_json_key \
  --docker-password="$(cat ./json-key-file.json)" \
  --docker-email=someone@tensorleap.ai
rm ./json-key-file.json

# deploy tensorleap to local cluster
kapp deploy -a on-prem -f ./dist
```

You can get the machine path using `multipass list --format json | jq -r '.list[] | select(.name == "microk8s-vm") | .ipv4 | first'`
Tensorleap is served in `http://MACHINE_IP` \
Create a user using signup requests in `http://MACHINE_IP/api/v2/swagger`

### On Ubuntu

```bash
sudo apt update
sudo apt upgrade

# nvidia driver
sudo apt install nvidia-driver-450

# zsh
sudo apt-get install -y zsh git vim
sudo chsh # change shell to /usr/bin/zsh and restart
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

vim $HOME/.zshrc
# plugins=(git microk8s zsh-syntax-highlighting)
#
# source <(kubectl completion zsh)
# [ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
#
# export EDITOR=vim
# export KUBE_EDITOR=vim
#
# alias k=kubectl
# alias kns=kubens
# alias kctx=kubectl
#
# autoload -U compinit && compinit
#
# set_microk8s_config() {
#   microk8s config > $HOME/.kube/config
# }

# kubectx and kubens
sudo git clone https://github.com/ahmetb/kubectx /opt/kubectx
sudo ln -s /opt/kubectx/kubectx /usr/local/bin/kubectx
sudo ln -s /opt/kubectx/kubens /usr/local/bin/kubens
mkdir -p ~/.oh-my-zsh/completions
chmod -R 755 ~/.oh-my-zsh/completions
ln -s /opt/kubectx/completion/_kubectx.zsh ~/.oh-my-zsh/completions/_kubectx.zsh
ln -s /opt/kubectx/completion/_kubens.zsh ~/.oh-my-zsh/completions/_kubens.zsh

# fzf
git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf
~/.fzf/install

# kubectl
# based on https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/
sudo apt-get install -y apt-transport-https ca-certificates curl
sudo curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg
echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
sudo apt-get install -y kubectl

# kapp
wget -O- https://carvel.dev/install.sh > install.sh
sudo bash install.sh
rm install.sh

# microk8s
sudo snap install microk8s --classic
sudo usermod -a -G microk8s $USER
sudo chown -f -R $USER ~/.kube
microk8s enable ingress dns storage rbac gpu
microk8s enable host-access:ip=10.0.1.20

# Get a service account key file with read permissions to storage and add to cluster
kubectl --kubeconfig=<(microk8s config) create secret docker-registry gcr-access-token \
  --docker-server=gcr.io \
  --docker-username=_json_key \
  --docker-password="$(cat ./json-key-file.json)" \
  --docker-email=someone@tensorleap.ai

# Installing tensorleap release
wget https://github.com/tensorleap/on-prem/releases/download/$RELEASE_TAG/tensorleap.tar.gz
mkdir tensorleap
tar -xzvf tensorleap.tar.gz -C ./tensorleap/
kapp deploy -a tl-blinkeye -f ./tensorleap
```

Tensorleap is served in `http://10.0.1.20` \
Create a user using signup requests in `http://10.0.1.20/api/v2/swagger`

### Setting local hostname

Run this to make the app accessible from http://tensorleap.local (or replace with your choice of domain)

```bash

# on mac:
echo "$(multipass list --format json | jq -r '.list[] | select(.name == "microk8s-vm") | .ipv4 | first')\ttensorleap.local" | sudo tee -a /etc/hosts

# on ubuntu:
echo "10.0.1.20\ttensorleap.local" | sudo tee -a /etc/hosts
```

##### Troubleshooting

1. The machine hostname must not include capital letters or numbers. if it does, change it in `/etc/hostname` and `/etc/hosts`
