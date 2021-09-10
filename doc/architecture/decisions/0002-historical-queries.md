# 2. Historical queries

Date: 2021-09-06

## Status

Accepted

## Context

We need to expose an interface to be able to fetch data from the existing channels using time filtering. It was requested by DSB users as "historical data query" feature.

## Decision

We should extend existing `GET /messages` endpoint with optional `from` parameter. `from` as serialized datetime in ISO8601 format (for e.g output of Date.prototype.toISOString()) When set it means that user is expecting to rewind the channel and receive messages from given point in time. Using `from` should not disturb the existing consumers made to get the latest messages.

The semantics of the `GET /messages` won't change and querying "historical" data would act the same as fetching all messages from the channel.

For e.g user want to get all messages from last 24h in 500 messages per batch

-   query `GET /messages?fqcn=test&amount-500&from=2021-09-06T00:00:00.000Z` until there is less than 500 messages in the last query

### NATS transport layer implementation

-   use `OptStartTime` to indicate the start time
-   create unique consumer based on naming schema `{from}{clientId}

## Consequences

It's possible to "rewind" the channel and fetch data from the past.
