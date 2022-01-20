# On Prem

## Installing microk8s

```
brew install ubuntu/microk8s/microk8s
microk8s install
microk8s enable ingress dns storage rbac
```

Create a user using signup requests in http://tensorleap.local/api/v2/swagger

### On Ubuntu

```
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

# chromium
sudo apt-get install chromium-browser

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
# add a line `10.0.1.20<TAB>tensorleap.local` to `/etc/hosts`

# Installing tensorleap release
wget https://github.com/tensorleap/on-prem/releases/download/$RELEASE_TAG/tensorleap.tar.gz
mkdir tensorleap
tar -xzvf tensorleap.tar.gz -C ./tensorleap/
kapp deploy -a tl-blinkeye -f ./tensorleap
```

##### Troubleshooting

1. The machine hostname must not include capital letters or numbers. if it does, change it in `/etc/hostname` and `/etc/hosts`

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

1. Run `multipass list --format json | jq -r '.list[] | select(.name == "microk8s-vm") | .ipv4 | first'` to get the cluster ip.
2. Edit `/etc/hosts` and add a line `<YOUR_CLUSTER_IP> tensorleap.local`
3. Navigate to http://tensorleap.local/
