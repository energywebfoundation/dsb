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
docker-compose -f infrastructure/compose.yml  up
```

## Installation

```shell
rush update
```

## Build

```shell
rush build
```

### Tests

```shell
rush test:e2e
```
