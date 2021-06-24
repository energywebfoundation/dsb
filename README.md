<h1 align="center">
  <br>
  <a href="https://www.energyweb.org/"><img src="https://www.energyweb.org/wp-content/uploads/2019/04/logo-brand.png" alt="EnergyWeb" width="150"></a>
  <br>
  EnergyWeb Decentralized Service Bus (DSB)
  <br>
  <br>
</h1>

<p align="center">
  <img src="https://github.com/energywebfoundation/dsb/actions/workflows/build.yml/badge.svg" />
</p>

## Preparation

1. Make sure you are using Node 14.x.x
2. Make sure have latest `@microsoft/rush` package manager installed.

```shell
npm install -g @microsoft/rush
```

## NATS Jetstream cluster

```shell
docker-compose -f infrastructure/compose.yml up
```

## Installation

```shell
rush update
```

## Build

```shell
rush build
```

## Build container

`dsb-message-broker` application comes with Dockerfile that leverages `rush deploy` output that prepares application and it's dependencies into deployable package.

```shell
rush build:container
```

Since `rush build:container` does not install or build the Typescript code you should follow [Installation](#Installation) and [Build](#Build) instructions.

## Tests

```shell
rush test:e2e
```

## Run

### Configuration

DSB Message Broker application uses environmental variables as configuration items

```
NATS_JS_URL = (optional string, default "nats://localhost:4222") NATS Jetstream node url

PORT = (optional int, default 3000) Port number to be used by DSB Message Broker to listen to

WITH_SWAGGER = (optional bool, default true) Boolean that enables or disables hosting Swagger API documentation alongside DSB Message Broker endpoints, if true then http://localhost:{PORT}/swagger is available
```

You can define custom values by using `apps/dsb-message-broker/.env` file or passing them directly for e.g `PORT=5000 rush start --verbose`

### From repository

```shell
rush start --verbose
```

### Using docker container

Build docker container using instructions from [Build container](#Build-container)

```shell
docker run --init -p 3000:3000 --network infrastructure_default --rm -it -e NATS_JS_URL=nats://nats_1:4222 -e PORT=3000 energyweb/dsb-message-broker:canary
```

Note that:

`--network infrastructure_default` and `NATS_JS_URL=nats://nats_1:4222` corresponds to a network and host when running NATS Jetstream cluster created using these [instructions](#nats-jetstream-cluster) (for more information on Docker Networking please refer to [https://docs.docker.com/network/](https://docs.docker.com/network/))
