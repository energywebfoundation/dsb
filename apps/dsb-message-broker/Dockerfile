FROM node:14-slim

RUN mkdir -p /var/deployment
COPY ./ /var/deployment

WORKDIR /var/deployment/apps/dsb-message-broker

ENTRYPOINT bin/dsb-message-broker