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

## Usage

DSB works based on two fundamental building blocks `channels` and `messages`. Channels are structures that allows publisher and subscribers to exchange message with at-least-once delivery semantics. DSB uses built-in persistency for every channel.

### Creating channels

A dedicated `POST /channel` endpoint should be used to create channel based on provided fqcn (fully qualified channel name)

Example code that creates `"test.channels.testapp.apps.testorganization.iam.ewc"` channel:

```
curl -X 'POST' \
  'http://localhost:3000/channel' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "fqcn": "test.channels.testapp.apps.testorganization.iam.ewc"
}'
```

or use Swagger UI `http://localhost:3000/swagger/#/default/ChannelController_create`

### Publishing messages

Before publishing to a channel make sure that channel described as fqcn (fully qualified channel name) has been created, for more info check [creating channels](#Creating-channels)

Message DTO is defined as:

```
{
  "fqcn": "test.channels.testapp.apps.testorganization.iam.ewc",
  "payload": "{\"data\": \"test\"}",
  "signature": "string"
}
```

Example code

```
curl -X 'POST' \
  'http://localhost:5000/message' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "fqcn": "test.channels.testapp.apps.testorganization.iam.ewc",
  "payload": "{\"data\": \"test\"}",
  "signature": "string"
}'
```

or use Swagger UI `http://localhost:5000/swagger/#/default/MessageController_publish`

### Receiving messages

DSB uses persistent consumers approach, which works as follows:

Every time user uses `GET /message?fqcn={fqcn}&amount=100` it receives consecutive 100 messages counting from the last call

Example:

-   channel `test` has 10 messages `[1,2,3,4,5,6,7,8,9,10]` with order based on publishing order
-   using `GET /message?fqcn=test&amount=3` returns messages `[1,2,3]`
-   calling `GET /message?fqcn=test&amount=3` again returns messages `[4,5,6]`
-   calling `GET /message?fqcn=test&amount=100` returns messages `[7,8,8,9,10]`

This approach of consuming channel data enables control over inflow of messages and allows for horizontal scaling on a receiving side. For e.g having 3 receiving nodes that are capable of processing 1000 messages at once

-   node 1 calls `GET /message?fqcn=test&amount=1000` to get a batch of 1000 messages and repeats when done
-   node 2 calls `GET /message?fqcn=test&amount=1000` to get a batch of 1000 messages and repeats when done
-   node 3 calls `GET /message?fqcn=test&amount=1000` to get a batch of 1000 messages and repeats when done

Note: Currently each node would need to use the same identity to authenticate to DSB Message Broker since consumers are bound to a identity.

Example code:

```
curl -X 'GET' \
  'http://localhost:5000/message?fqcn=test.channels.testapp.apps.testorganization.iam.ewc&amount=1000' \
  -H 'accept: application/json'
```

or use Swagger UI `http://localhost:5000/swagger/#/default/MessageController_getNewFromChannel`
