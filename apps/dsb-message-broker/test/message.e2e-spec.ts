import { HttpStatus, INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PublishMessageDto } from '../src/message/dto/publish-message.dto';
import { AppModule } from '../src/app.module';
import { request } from './request';
import { ChannelManagerService } from './channel-manager.service';
import { ChannelService } from '../src/channel/channel.service';
import { MessageDto } from '../src/message/dto/message.dto';
import { expect } from 'chai';
import { JwtAuthGuard } from '../src/auth/jwt.guard';

describe('MessageController (e2e)', () => {
    let app: INestApplication;
    let channelManagerService: ChannelManagerService;

    const authenticatedUser = {
        did: 'did:ethr:0x46646c919278e1Dac6ef3B02BC520A82B8FaA596',
        verifiedRoles: [{ name: 'user', namespace: 'user.roles.dsb.apps.energyweb.iam.ewc' }]
    };
    const authenticatedUser2 = {
        did: 'did:ethr:0x46646c919278e1Dac6ef3B02BC520A82B8FaA237',
        verifiedRoles: [{ name: 'user', namespace: 'user.roles.dsb.apps.energyweb.iam.ewc' }]
    };
    const authenticatedUser3 = {
        did: 'did:ethr:0x46646c919278e1Dac6ef3B02BC520A82B8FaA237',
        verifiedRoles: [] as any[]
    };

    const authGuard: CanActivate = {
        canActivate: (context: ExecutionContext) => {
            const req = context.switchToHttp().getRequest();
            const userNo = req.get('User-No');
            if (userNo === '2') req.user = authenticatedUser2;
            else if (userNo === '3') req.user = authenticatedUser3;
            else req.user = authenticatedUser;

            return true;
        }
    };

    before(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule]
        })
            .overrideGuard(JwtAuthGuard)
            .useValue(authGuard)
            .compile();

        app = moduleFixture.createNestApplication();
        const channelService = await app.resolve<ChannelService>(ChannelService);

        // TODO: use DI from Nest after fixing an issue where ChannelService cannot be found to inject
        channelManagerService = new ChannelManagerService(channelService);

        app.useLogger(['log', 'error']);

        await app.init();
    });

    after(async () => {
        await channelManagerService.cleanUp();
    });

    it('should publish a message to existing channel', async () => {
        const fqcn = 'test1.channels.dsb.apps.energyweb.iam.ewc';
        const message: PublishMessageDto = {
            fqcn,
            payload: 'payload',
            signature: 'sig'
        };

        try {
            await channelManagerService.create({ fqcn });
        } catch (e) {}

        await request(app).post('/message').send(message).expect(HttpStatus.CREATED);
    });

    it('should not publish a message to missing channel', async () => {
        const fqcn = 'missing.channels.dsb.apps.energyweb.iam.ewc';
        const message: PublishMessageDto = {
            fqcn,
            payload: 'payload',
            signature: 'sig'
        };

        await request(app).post('/message').send(message).expect(HttpStatus.NOT_FOUND);
    });

    it('should be able to receive no messages if channel is empty', async () => {
        const fqcn = 'test200.channels.dsb.apps.energyweb.iam.ewc';
        await channelManagerService.create({ fqcn });

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=10`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const messages = res.body as MessageDto[];

                expect(messages).to.have.lengthOf(0);
            });
    });

    it('should be able to receive a message that was previously published', async () => {
        const fqcn = 'test300.channels.dsb.apps.energyweb.iam.ewc';

        const message: PublishMessageDto = {
            fqcn,
            payload: 'payload',
            signature: 'sig'
        };

        await channelManagerService.create({ fqcn });
        await request(app).post('/message').send(message).expect(HttpStatus.CREATED);

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=10`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const messages = res.body as MessageDto[];

                expect(messages).to.have.lengthOf(1);

                expect(messages[0].payload).to.be.equal(message.payload);
                expect(messages[0].signature).to.be.equal(message.signature);
                expect(messages[0].sender).to.be.equal(authenticatedUser.did);
            });
    });

    it('should be able to receive multiple messages that were previously published in FIFO order', async () => {
        const fqcn = 'test400.channels.dsb.apps.energyweb.iam.ewc';

        const message: PublishMessageDto = {
            fqcn,
            payload: 'payload',
            signature: 'sig'
        };

        await channelManagerService.create({ fqcn });

        await request(app)
            .post('/message')
            .send({ ...message, payload: '1' })
            .expect(HttpStatus.CREATED);
        await request(app)
            .post('/message')
            .send({ ...message, payload: '2' })
            .expect(HttpStatus.CREATED);
        await request(app)
            .post('/message')
            .send({ ...message, payload: '3' })
            .expect(HttpStatus.CREATED);

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=3`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const messages = res.body as MessageDto[];

                expect(messages).to.have.lengthOf(3);
                expect(messages[0].payload).to.be.equal('1');
                expect(messages[2].payload).to.be.equal('3');
            });
    });

    it('should be able to receive multiple messages that were previously published in FIFO order using 2 pull requests', async () => {
        const fqcn = 'test500.channels.dsb.apps.energyweb.iam.ewc';

        const message: PublishMessageDto = {
            fqcn,
            payload: 'payload',
            signature: 'sig'
        };

        await channelManagerService.create({ fqcn });

        await request(app)
            .post('/message')
            .send({ ...message, payload: '1' })
            .expect(HttpStatus.CREATED);
        await request(app)
            .post('/message')
            .send({ ...message, payload: '2' })
            .expect(HttpStatus.CREATED);
        await request(app)
            .post('/message')
            .send({ ...message, payload: '3' })
            .expect(HttpStatus.CREATED);

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=1`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const messages = res.body as MessageDto[];

                expect(messages).to.have.lengthOf(1);
                expect(messages[0].payload).to.be.equal('1');
            });

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=2`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const messages = res.body as MessageDto[];

                expect(messages).to.have.lengthOf(2);
                expect(messages[0].payload).to.be.equal('2');
                expect(messages[1].payload).to.be.equal('3');
            });
    });

    it('should be able to receive the message that contains the correlation id set by sender', async () => {
        const fqcn = 'test-correlation-id.channels.dsb.apps.energyweb.iam.ewc';

        const message: PublishMessageDto = {
            fqcn,
            payload: 'payload',
            signature: 'sig',
            correlationId: 'id'
        };

        await channelManagerService.create({ fqcn });

        await request(app).post('/message').send(message).expect(HttpStatus.CREATED);

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=3`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const [receivedMessage] = res.body as MessageDto[];

                expect(receivedMessage.correlationId).to.be.equal(message.correlationId);
            });
    });

    it('should receive single message when sending with same correlation id withing 2min dedupe window', async () => {
        const fqcn = 'test-message-dedupe.channels.dsb.apps.energyweb.iam.ewc';

        const message: PublishMessageDto = {
            fqcn,
            payload: 'payload',
            signature: 'sig',
            correlationId: 'id'
        };

        await channelManagerService.create({ fqcn });

        await request(app)
            .post('/message')
            .send({ ...message, payload: '1' })
            .expect(HttpStatus.CREATED);

        await request(app)
            .post('/message')
            .send({ ...message, payload: '2' })
            .expect(HttpStatus.CREATED);

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=3`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const receivedMessages = res.body as MessageDto[];

                expect(receivedMessages).to.have.lengthOf(1);
                expect(receivedMessages[0].payload).to.be.equal('1');
            });
    });

    it('should be able to restart the consumer by using unique clientId', async () => {
        const fqcn = 'restart.channels.dsb.apps.energyweb.iam.ewc';

        const message: PublishMessageDto = {
            fqcn,
            payload: 'payload',
            signature: 'sig'
        };

        await channelManagerService.create({ fqcn });

        await request(app)
            .post('/message')
            .send({ ...message, payload: '1' })
            .expect(HttpStatus.CREATED);

        await request(app)
            .post('/message')
            .send({ ...message, payload: '2' })
            .expect(HttpStatus.CREATED);

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=10&clientId=1`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const messages = res.body as MessageDto[];

                expect(messages).to.have.lengthOf(2);
            });

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=10&clientId=2`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const messages = res.body as MessageDto[];

                expect(messages).to.have.lengthOf(2);
            });
    });

    it('should be able to receive messages that are published after certain point in time by using "from" parameter', async () => {
        const fqcn = 'timed.channels.dsb.apps.energyweb.iam.ewc';

        const message: PublishMessageDto = {
            fqcn,
            payload: 'payload',
            signature: 'sig'
        };

        await channelManagerService.create({ fqcn });

        await request(app)
            .post('/message')
            .send({ ...message, payload: '1' })
            .expect(HttpStatus.CREATED);

        await request(app)
            .post('/message')
            .send({ ...message, payload: '2' })
            .expect(HttpStatus.CREATED);

        await sleep(5000);
        const now = new Date().toISOString();
        await sleep(5000);

        await request(app)
            .post('/message')
            .send({ ...message, payload: '3' })
            .expect(HttpStatus.CREATED);

        await request(app)
            .post('/message')
            .send({ ...message, payload: '4' })
            .expect(HttpStatus.CREATED);

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=10&from=${now}`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                const messages = res.body as MessageDto[];

                expect(messages).to.have.lengthOf(2);

                expect(messages[0].payload).to.equal('3');
                expect(messages[1].payload).to.equal('4');
            });
    });

    it('should not publish a message without having user role', async () => {
        const fqcn = 'test1.channels.dsb.apps.energyweb.iam.ewc';
        const message: PublishMessageDto = {
            fqcn,
            topic: 'testTopic',
            payload: '{"data": "testData"}',
            signature: 'sig'
        };

        await request(app)
            .patch('/channel')
            .send({
                fqcn,
                topics: [
                    {
                        namespace: 'testTopic',
                        schema: '{"type": "object","properties": {"data": {"type": "string"}},"required": ["data"],"additionalProperties": false}'
                    },
                    {
                        namespace: 'testTopic_xml',
                        schemaType: 'XSD',
                        schema: '<?xml version="1.0"?> <xsd:schema targetNamespace="http://www.loc.gov/MARC21/slim" xmlns="http://www.loc.gov/MARC21/slim" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" attributeFormDefault="unqualified" version="1.1" xml:lang="en"> <xsd:annotation> <xsd:documentation> MARCXML: The MARC 21 XML Schema Prepared by Corey Keith May 21, 2002 - Version 1.0 - Initial Release ********************************************** Changes. August 4, 2003 - Version 1.1 - Removed import of xml namespace and the use of xml:space="preserve" attributes on the leader and controlfields. Whitespace preservation in these subfields is accomplished by the use of xsd:whiteSpace value="preserve" May 21, 2009 - Version 1.2 - in subfieldcodeDataType the pattern "[\\da-z!&quot;#$%&amp;\'()*+,-./:;&lt;=&gt;?{}_^`~\\[\\]\\]{1}" changed to: "[\\dA-Za-z!&quot;#$%&amp;\'()*+,-./:;&lt;=&gt;?{}_^`~\\[\\]\\]{1}" i.e "A-Z" added after "[\\d" before "a-z" to allow upper case. This change is for consistency with the documentation. ************************************************************ This schema supports XML markup of MARC21 records as specified in the MARC documentation (see www.loc.gov). It allows tags with alphabetics and subfield codes that are symbols, neither of which are as yet used in the MARC 21 communications formats, but are allowed by MARC 21 for local data. The schema accommodates all types of MARC 21 records: bibliographic, holdings, bibliographic with embedded holdings, authority, classification, and community information. </xsd:documentation> </xsd:annotation> <xsd:element name="record" type="recordType" nillable="true" id="record.e"> <xsd:annotation> <xsd:documentation>record is a top level container element for all of the field elements which compose the record</xsd:documentation> </xsd:annotation> </xsd:element> <xsd:element name="collection" type="collectionType" nillable="true" id="collection.e"> <xsd:annotation> <xsd:documentation>collection is a top level container element for 0 or many records</xsd:documentation> </xsd:annotation> </xsd:element> <xsd:complexType name="collectionType" id="collection.ct"> <xsd:sequence minOccurs="0" maxOccurs="unbounded"> <xsd:element ref="record"/> </xsd:sequence> <xsd:attribute name="id" type="idDataType" use="optional"/> </xsd:complexType> <xsd:complexType name="recordType" id="record.ct"> <xsd:sequence minOccurs="0"> <xsd:element name="leader" type="leaderFieldType"/> <xsd:element name="controlfield" type="controlFieldType" minOccurs="0" maxOccurs="unbounded"/> <xsd:element name="datafield" type="dataFieldType" minOccurs="0" maxOccurs="unbounded"/> </xsd:sequence> <xsd:attribute name="type" type="recordTypeType" use="optional"/> <xsd:attribute name="id" type="idDataType" use="optional"/> </xsd:complexType> <xsd:simpleType name="recordTypeType" id="type.st"> <xsd:restriction base="xsd:NMTOKEN"> <xsd:enumeration value="Bibliographic"/> <xsd:enumeration value="Authority"/> <xsd:enumeration value="Holdings"/> <xsd:enumeration value="Classification"/> <xsd:enumeration value="Community"/> </xsd:restriction> </xsd:simpleType> <xsd:complexType name="leaderFieldType" id="leader.ct"> <xsd:annotation> <xsd:documentation>MARC21 Leader, 24 bytes</xsd:documentation> </xsd:annotation> <xsd:simpleContent> <xsd:extension base="leaderDataType"> <xsd:attribute name="id" type="idDataType" use="optional"/> </xsd:extension> </xsd:simpleContent> </xsd:complexType> <xsd:simpleType name="leaderDataType" id="leader.st"> <xsd:restriction base="xsd:string"> <xsd:whiteSpace value="preserve"/> <xsd:pattern value="[\\d ]{5}[\\dA-Za-z ]{1}[\\dA-Za-z]{1}[\\dA-Za-z ]{3}(2| )(2| )[\\d ]{5}[\\dA-Za-z ]{3}(4500| )"/> </xsd:restriction> </xsd:simpleType> <xsd:complexType name="controlFieldType" id="controlfield.ct"> <xsd:annotation> <xsd:documentation>MARC21 Fields 001-009</xsd:documentation> </xsd:annotation> <xsd:simpleContent> <xsd:extension base="controlDataType"> <xsd:attribute name="id" type="idDataType" use="optional"/> <xsd:attribute name="tag" type="controltagDataType" use="required"/> </xsd:extension> </xsd:simpleContent> </xsd:complexType> <xsd:simpleType name="controlDataType" id="controlfield.st"> <xsd:restriction base="xsd:string"> <xsd:whiteSpace value="preserve"/> </xsd:restriction> </xsd:simpleType> <xsd:simpleType name="controltagDataType" id="controltag.st"> <xsd:restriction base="xsd:string"> <xsd:whiteSpace value="preserve"/> <xsd:pattern value="00[1-9A-Za-z]{1}"/> </xsd:restriction> </xsd:simpleType> <xsd:complexType name="dataFieldType" id="datafield.ct"> <xsd:annotation> <xsd:documentation>MARC21 Variable Data Fields 010-999</xsd:documentation> </xsd:annotation> <xsd:sequence maxOccurs="unbounded"> <xsd:element name="subfield" type="subfieldatafieldType"/> </xsd:sequence> <xsd:attribute name="id" type="idDataType" use="optional"/> <xsd:attribute name="tag" type="tagDataType" use="required"/> <xsd:attribute name="ind1" type="indicatorDataType" use="required"/> <xsd:attribute name="ind2" type="indicatorDataType" use="required"/> </xsd:complexType> <xsd:simpleType name="tagDataType" id="tag.st"> <xsd:restriction base="xsd:string"> <xsd:whiteSpace value="preserve"/> <xsd:pattern value="(0([1-9A-Z][0-9A-Z])|0([1-9a-z][0-9a-z]))|(([1-9A-Z][0-9A-Z]{2})|([1-9a-z][0-9a-z]{2}))"/> </xsd:restriction> </xsd:simpleType> <xsd:simpleType name="indicatorDataType" id="ind.st"> <xsd:restriction base="xsd:string"> <xsd:whiteSpace value="preserve"/> <xsd:pattern value="[\\da-z ]{1}"/> </xsd:restriction> </xsd:simpleType> <xsd:complexType name="subfieldatafieldType" id="subfield.ct"> <xsd:simpleContent> <xsd:extension base="subfieldDataType"> <xsd:attribute name="id" type="idDataType" use="optional"/> <xsd:attribute name="code" type="subfieldcodeDataType" use="required"/> </xsd:extension> </xsd:simpleContent> </xsd:complexType> <xsd:simpleType name="subfieldDataType" id="subfield.st"> <xsd:restriction base="xsd:string"> <xsd:whiteSpace value="preserve"/> </xsd:restriction> </xsd:simpleType> <xsd:simpleType name="subfieldcodeDataType" id="code.st"> <xsd:restriction base="xsd:string"> <xsd:whiteSpace value="preserve"/> <xsd:pattern value="[\\dA-Za-z!&quot;#$%&amp;\'()*+,-./:;&lt;=&gt;?{}_^`~\\[\\]\\\\]{1}"/> <!-- "A-Z" added after "\\d" May 21, 2009 --> </xsd:restriction> </xsd:simpleType> <xsd:simpleType name="idDataType" id="id.st"> <xsd:restriction base="xsd:ID"/> </xsd:simpleType> </xsd:schema>'
                    }
                ],
                publishers: ['did:ethr:0x46646c919278e1Dac6ef3B02BC520A82B8FaA237'],
                subscribers: ['did:ethr:0x46646c919278e1Dac6ef3B02BC520A82B8FaA237']
            })
            .set('User-No', '1')
            .expect(HttpStatus.OK);

        await request(app)
            .post('/message')
            .send(message)
            .set('User-No', '3')
            .expect(HttpStatus.FORBIDDEN);
    });

    it('should not receive messages without having user role', async () => {
        const fqcn = 'test1.channels.dsb.apps.energyweb.iam.ewc';

        await request(app)
            .get(`/message?fqcn=${fqcn}&amount=10`)
            .set('User-No', '3')
            .expect(HttpStatus.FORBIDDEN);
    });

    it('should not publish a message without being publisher', async () => {
        const fqcn = 'test1.channels.dsb.apps.energyweb.iam.ewc';
        const message: PublishMessageDto = {
            fqcn,
            topic: 'testTopic',
            payload: '{"data": "testData"}',
            signature: 'sig'
        };

        await request(app).post('/message').send(message).expect(HttpStatus.UNAUTHORIZED);
    });

    it('should not receive messages without being subscriber', async () => {
        const fqcn = 'test1.channels.dsb.apps.energyweb.iam.ewc';

        await request(app).get(`/message?fqcn=${fqcn}&amount=10`).expect(HttpStatus.UNAUTHORIZED);
    });

    it('should not publish a message if payload is not in JSON format', async () => {
        const fqcn = 'test1.channels.dsb.apps.energyweb.iam.ewc';
        const message: PublishMessageDto = {
            fqcn,
            topic: 'testTopic',
            payload: '{"data": testData}',
            signature: 'sig'
        };

        await request(app)
            .post('/message')
            .send(message)
            .set('User-No', '2')
            .expect(HttpStatus.BAD_REQUEST);
    });

    it('should not publish a message if message payload does not match the schema (JSON)', async () => {
        const fqcn = 'test1.channels.dsb.apps.energyweb.iam.ewc';
        const message: PublishMessageDto = {
            fqcn,
            topic: 'testTopic',
            payload: '{"datax": "testData"}',
            signature: 'sig'
        };

        await request(app)
            .post('/message')
            .send(message)
            .set('User-No', '2')
            .expect(HttpStatus.BAD_REQUEST);
    });

    it('should be able to publish a message if message payload matches the schema (JSON)', async () => {
        const fqcn = 'test1.channels.dsb.apps.energyweb.iam.ewc';
        const message: PublishMessageDto = {
            fqcn,
            topic: 'testTopic',
            payload: '{"data": "testData"}',
            signature: 'sig'
        };

        await request(app)
            .post('/message')
            .send(message)
            .set('User-No', '2')
            .expect(HttpStatus.CREATED);
    });

    it('should not publish a message if message payload does not match the schema (XML)', async () => {
        const fqcn = 'test1.channels.dsb.apps.energyweb.iam.ewc';
        const message: PublishMessageDto = {
            fqcn,
            topic: 'testTopic',
            payload: '{"datax": "testData"}',
            signature: 'sig'
        };

        await request(app)
            .post('/message')
            .send(message)
            .set('User-No', '2')
            .expect(HttpStatus.BAD_REQUEST);
    });

    it('should be able to publish a message if message payload matches the schema (XML)', async () => {
        const fqcn = 'test1.channels.dsb.apps.energyweb.iam.ewc';
        const message: PublishMessageDto = {
            fqcn,
            topic: 'testTopic_xml',
            payload:
                '<?xml version="1.0" encoding="utf-8"?><collection xmlns="http://www.loc.gov/MARC21/slim" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.loc.gov/MARC21/slim file:///applis/istex/home/li/li-prep/src/javaProject/etc/xsd/MARC21slim.xsd">  <record>    <leader>01714nam  2200325Ia 4500</leader>    <controlfield tag="001">ocm11985480e </controlfield>    <controlfield tag="003">OCoLC</controlfield>    <controlfield tag="005">19890711162336.0</controlfield>    <controlfield tag="006">m    g   d        </controlfield>    <controlfield tag="007">cr bn |||a|bb|</controlfield>    <controlfield tag="008">850501s1684    enk     s     00| | eng d</controlfield>    <datafield ind1=" " ind2=" " tag="037">      <subfield code="a">CL0037000002</subfield>      <subfield code="b">ProQuest Information and Learning. 300 N. Zeeb Rd., Ann Arbor, MI 48106</subfield>    </datafield>  </record></collection>',
            signature: 'sig'
        };

        await request(app)
            .post('/message')
            .send(message)
            .set('User-No', '2')
            .expect(HttpStatus.CREATED);
    });

    function sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    it('should not publish a message that exceeds max message payload size', async () => {
        const fqcn = 'size.channels.dsb.apps.energyweb.iam.ewc';
        const message: PublishMessageDto = {
            fqcn,
            payload: JSON.stringify({ foo: 'bar' }),
            signature: 'sig'
        };

        await channelManagerService.create({ fqcn, maxMsgSize: 16 });

        await sleep(1000);

        await request(app).post('/message').send(message).expect(HttpStatus.BAD_REQUEST);

        await channelManagerService.update({ fqcn, maxMsgSize: 1024 });

        await sleep(1000);

        await request(app).post('/message').send(message).expect(HttpStatus.CREATED);
    });
});
