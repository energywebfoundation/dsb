<h1 align="center">
  <br>
  <a href="https://www.energyweb.org/"><img src="https://www.energyweb.org/wp-content/uploads/2019/04/logo-brand.png" alt="EnergyWeb" width="150"></a>
  <br>
  EnergyWeb Decentralized Service Bus (DSB)
  <br>
  <br>
</h1>

<p align="center">
  <img src="https://github.com/energywebfoundation/dsb/actions/workflows/master.yml/badge.svg" />
</p>

## Disclaimer

This repository is currently under development and considered early _alpha_ stage, changes to data structures, APIs and general way of working may occur.

## Overview

EW-DSB is the messaging service of the EW-DOS’s utility layer. Unlike any other centralised and managed pub/sub messaging systems, EW-DSB is designed and implemented to be fully decentralised and scalable. Messages shared on EW-DSB can be traced back to its original sender using cryptographic signatures; it adds extra security to data exchanges. One of the key benefits of the EW-DSB is to be schema agnostic, meaning any type of schema can be shared as a message between users/systems.

## Key features

-   Per channel DID based authentication and authorization system
-   At-least-once delivery; exactly once within a window
-   Channels persistency and replayability using consumers
-   Per topic payload schema definitions

_Current DSB implementation is using NATS Jetstream as default transport layer and thus inherits it's characteristics._

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

JWT_SECRET = (required string) JWT authentication token secret

PRIVATE_KEY = (required string) ECDSA private key as 64(hex) characters with messagebroker.roles.dsb.apps.energyweb.iam.ewc role, read more on #

MB_DID = (required string) it is the DID identifier corresponding to the PRIVATE_KEY

WEB3_URL = (optional string, default https://volta-rpc.energyweb.org/) An URL to EW blockchain node (default

CACHE_SERVER_URL = (optional string, default https://identitycache-dev.energyweb.org/v1) An URL to Identity Cache server, more info https://github.com/energywebfoundation/iam-cache-server

DUPLICATE_WINDOW = (optional number, default 120) The window (in seconds) to track duplicate messages in each channel based on correlationId
```

You can define custom values by using `apps/dsb-message-broker/.env` file or passing them directly for e.g `PORT=5000 rush start --verbose`

### Message Broker owner roles

Each DSB Message Broker owner is required to provide `PRIVATE_KEY` as configuration item that is owning the DID with `messagebroker.roles.dsb.apps.energyweb.iam.ewc` role.

In order to enroll to that specific role please follow these steps:

1.  visit EWF Switchboard management tool under https://switchboard-dev.energyweb.org/ and chose one of the available signing methods
2.  make sure you are using Volta testnet
3.  if you chose the account that never been used with Switchboard before you will be asked to execute transaction with will setup and create an DID document
4.  next in order to enroll to `messagebroker` role please visit https://switchboard-dev.energyweb.org/enrol?app=dsb.apps.energyweb.iam.ewc&roleName=messagebroker
5.  select both on-chain and off-chain checkboxes and press submit
6.  you should now see the enrollment request with pending state in My Enrollments tab
7.  since now the role administrator needs to approve your role please sent a short email to dsb@energyweb.org with your pending DID identifier
8.  after getting confirmation from the team, please login to https://switchboard-dev.energyweb.org/ and navigate to Enrollments and then My Enrollments to sync your DID Document (using three dots next to Approved `messagebroker.roles.dsb.apps.energyweb.iam.ewc`)

### Message Broker user roles

Each DSB Message Broker user is required to have at least `user.roles.dsb.apps.energyweb.iam.ewc` to be able to send and receive messages to/from channels without additional roles requirements.

In order to enroll to that specific role please follow these steps:

1. see previous chapter
2. see previous chapter
3. see previous chapter
4. next in order to enroll to `user` role please visit https://switchboard-dev.energyweb.org/enrol?app=dsb.apps.energyweb.iam.ewc&roleName=user
5. see previous chapter
6. see previous chapter
7. see previous chapter
8. after getting confirmation from the team, please login to https://switchboard-dev.energyweb.org/ and navigate to Enrollments and then My Enrollments to sync your DID Document (using three dots next to Approved `user.roles.dsb.apps.energyweb.iam.ewc`)

Channel creation requires additional role defined as `channelcreation.roles.dsb.apps.energyweb.iam.ewc`.

In order to enroll to that specific role please follow these steps:

1. see previous chapter
2. see previous chapter
3. see previous chapter
4. next in order to enroll to `channelcreation` role please visit https://switchboard-dev.energyweb.org/enrol?app=dsb.apps.energyweb.iam.ewc&roleName=channelcreation
5. see previous chapter
6. see previous chapter
7. see previous chapter
8. after getting confirmation from the team, please login to https://switchboard-dev.energyweb.org/ and navigate to Enrollments and then My Enrollments to sync your DID Document (using three dots next to Approved `channelcreation.roles.dsb.apps.energyweb.iam.ewc`)

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

All examples below assumes that DSB Message Broker is run and available locally under http://localhost:3000 host.

### Login

Before you can start using DSB Message Broker (as a DSB user) you need to complete login procedure and acquire `access-token`. The required `identityToken` is a JWT signed token using ES256 algorithm.

Header:

```json
{
    "alg": "ES256",
    "typ": "JWT"
}
```

Payload:

```json
{
    "iss": "did:ethr:<address>",
    "claimData": {
        "blockNumber": <blockNumber>
    }
}
```

-   `address` should be set to the address (hashed public key) of your private key
-   `blockNumber` should be set to the current block number of the network set in the `WEB3_URL` (this has to be at most 4 blocks behind the current block read by the auth mechanism)

For generating JWT token for testing purposes use our developers test tool: https://stackblitz.com/edit/js-vyf8ms

```shell
curl -X 'POST' \
  'http://localhost:3000/auth/login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "identityToken": "<JWT Signed Token>"
}'
```

### Creating channels

A dedicated `POST /channel` endpoint should be used to create channel based on provided fqcn (fully qualified channel name)

Example code that creates `"test.channels.testapp.apps.testorganization.iam.ewc"` channel:

```shell
curl -X 'POST' \
  'http://localhost:3000/channel' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token acquired from POST /auth/login method' \
  -d '{
  "fqcn": "test.channels.testapp.apps.testorganization.iam.ewc"
}'
```

or use Swagger UI `http://localhost:3000/swagger/#/default/ChannelController_create`

### Publishing messages

Before publishing to a channel make sure that channel described as fqcn (fully qualified channel name) has been created, for more info check [creating channels](#Creating-channels)

Message DTO is defined as:

```shell
{
  "fqcn": "test.channels.testapp.apps.testorganization.iam.ewc",
  "payload": "{\"data\": \"test\"}",
  "signature": "string",
  "topic": "string" (optional),
  "correlationId": "string" (optional)
}
```

`correlationId` (if set) is used for message deduplication mechanism based on 2min window of time. For e.g in case two messages with same `correlationId` were sent within 2min window, only first will be delivered to recipients.

Example code

```shell
curl -X 'POST' \
  'http://localhost:3000/message' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token acquired from POST /auth/login method' \
  -d '{
  "fqcn": "test.channels.testapp.apps.testorganization.iam.ewc",
  "payload": "{\"data\": \"test\"}",
  "signature": "string",
  "correlationId": "id"
}'
```

or use Swagger UI `http://localhost:5000/swagger/#/default/MessageController_publish`

### Receiving messages

DSB uses persistent consumers approach, which works as follows:

Every time user uses `GET /message?fqcn={fqcn}&amount=100` it receives consecutive 100 messages counting from the last call

Example:

-   channel `test` has 10 messages `[1,2,3,4,5,6,7,8,9,10]` with order based on publishing order
-   calling `GET /message?fqcn=test&amount=3` returns messages `[1,2,3]`
-   calling `GET /message?fqcn=test&amount=3` again returns messages `[4,5,6]`
-   calling `GET /message?fqcn=test&amount=100` returns messages `[7,8,8,9,10]`

This approach of consuming channel data enables control over inflow of messages and allows for horizontal scaling on a receiving side. For e.g having 3 receiving nodes that are capable of processing 1000 messages at once

-   node 1 calls `GET /message?fqcn=test&amount=1000` to get a batch of 1000 messages and repeats when done
-   node 2 calls `GET /message?fqcn=test&amount=1000` to get a batch of 1000 messages and repeats when done
-   node 3 calls `GET /message?fqcn=test&amount=1000` to get a batch of 1000 messages and repeats when done

In order to "restart" the stream cursor it's possible to specify `clientId={id}` query parameter.

Example:

-   channel `test` has 10 messages `[1,2,3,4,5,6,7,8,9,10]` with order based on publishing order
-   calling `GET /message?fqcn=test&amount=3&clientId=1` returns messages `[1,2,3]`
-   calling `GET /message?fqcn=test&amount=3&clientId=2` returns messages `[1,2,3]`
-   calling `GET /message?fqcn=test&amount=3&clientId=1` again returns messages `[4,5,6]`
-   calling `GET /message?fqcn=test&amount=100&clientId=1` returns messages `[7,8,8,9,10]`

Example code:

```shell
curl -X 'GET' \
  'http://localhost:3000/message?fqcn=test.channels.testapp.apps.testorganization.iam.ewc&amount=1000' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token acquired from POST /auth/login method'
```

or use Swagger UI `http://localhost:5000/swagger/#/default/MessageController_getNewFromChannel`
