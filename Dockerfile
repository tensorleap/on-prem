FROM node:16-alpine3.13

RUN apk add --update curl openssl

RUN curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | sh
RUN helm repo add elastic https://helm.elastic.co

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm ci

COPY cdk8s.yaml .
COPY tsconfig.json .
COPY .eslintrc.yml .
COPY .prettierignore .
COPY .prettierrc.yml .

COPY imports ./imports/
COPY constructs ./constructs/
COPY main.ts .

COPY jest.config.js .
COPY main.test.ts .

RUN npm run build

CMD npm run synth -- --stdout
