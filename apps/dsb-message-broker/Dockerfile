FROM node:14-alpine

RUN mkdir -p /var/deployment
COPY ./ /var/deployment

WORKDIR /var/deployment/apps/dsb-message-broker

CMD ["/bin/sh", "-c", "bin/dsb-message-broker"]