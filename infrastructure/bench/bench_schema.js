'use strict';

const autocannon = require('autocannon');

const instance = autocannon({
    url: 'https://dsb-dev.energyweb.org/message',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        Authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkaWQiOiJkaWQ6ZXRocjoweDNlZjVhNWFCODEyNmFEOGZjYmM3NmQxRTQ2ODk3MEI2MjdkNGFhMDIiLCJ2ZXJpZmllZFJvbGVzIjpbeyJuYW1lIjoiY2hhbm5lbGNyZWF0aW9uIiwibmFtZXNwYWNlIjoiY2hhbm5lbGNyZWF0aW9uLnJvbGVzLmRzYi5hcHBzLmVuZXJneXdlYi5pYW0uZXdjIn0seyJuYW1lIjoidXNlciIsIm5hbWVzcGFjZSI6InVzZXIucm9sZXMuZHNiLmFwcHMuZW5lcmd5d2ViLmlhbS5ld2MifV0sImlhdCI6MTYzMjIzMTU0Nn0.awUDmL1c7ownf_YsqsjR5KzAyOXe4iTpiZOKU4gxceA'
    },
    body: JSON.stringify({
        fqcn: 'ewfTestNem.channels.dsb.apps.energyweb.iam.ewc',
        topic: 'boffer',
        signature:
            '0xa7be561d6c9de5d9dd6c54686ea186fa7691f349f7d028077ff403713421ff3c17bd4693d7f1b8b5a2dd6c248c0d1050d1597b944ca6316b12749b571f3050941c',
        payload: JSON.stringify({
            versionNumber: 63080321,
            duid: 'Lorem deserunt mollit in ea',
            submissionDateTime: 'cillum sed adipisicing',
            tradingDate: 'proident in et',
            energyPeriods: [
                {
                    periodId: -32957360,
                    fixedLoad: -14555762.796726882
                }
            ],
            accumulateBands: 'aliqua elit do',
            prices: [35870225.79719046],
            bofferAggLevel: 'Duis ut reprehenderit culpa magna',
            rebidExplanation: 'magna ullamco est dolore aute'
        })
    }),
    connections: 25, //default
    pipelining: 1, // default
    duration: 5 // default
});

autocannon.track(instance, { renderProgressBar: false });
