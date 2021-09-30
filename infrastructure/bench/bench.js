'use strict';

const autocannon = require('autocannon');

const instance = autocannon({
    url: 'http://localhost:3000/message',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        Authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkaWQiOiJkaWQ6ZXRocjoweDNlZjVhNWFCODEyNmFEOGZjYmM3NmQxRTQ2ODk3MEI2MjdkNGFhMDIiLCJ2ZXJpZmllZFJvbGVzIjpbeyJuYW1lIjoiY2hhbm5lbGNyZWF0aW9uIiwibmFtZXNwYWNlIjoiY2hhbm5lbGNyZWF0aW9uLnJvbGVzLmRzYi5hcHBzLmVuZXJneXdlYi5pYW0uZXdjIn0seyJuYW1lIjoidXNlciIsIm5hbWVzcGFjZSI6InVzZXIucm9sZXMuZHNiLmFwcHMuZW5lcmd5d2ViLmlhbS5ld2MifV0sImlhdCI6MTYzMjIzMTU0Nn0.awUDmL1c7ownf_YsqsjR5KzAyOXe4iTpiZOKU4gxceA'
    },
    body: JSON.stringify({
        fqcn: 'ewfTestWem.channels.dsb.apps.energyweb.iam.ewc',
        topic: 'testTopic',
        signature:
            '0xa7be561d6c9de5d9dd6c54686ea186fa7691f349f7d028077ff403713421ff3c17bd4693d7f1b8b5a2dd6c248c0d1050d1597b944ca6316b12749b571f3050941c',
        payload: '{}'
    }),
    connections: 25, //default
    pipelining: 1, // default
    duration: 5 // default
});

autocannon.track(instance, { renderProgressBar: false });
