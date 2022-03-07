import { HttpStatus, INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { request } from './request';
import { ChannelManagerService } from './channel-manager.service';
import { ChannelService } from '../src/channel/channel.service';
import { JwtAuthGuard } from '../src/auth/jwt.guard';
import { expect } from 'chai';

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('ChannelController (e2e)', () => {
    let app: INestApplication;

    const fqcn = 'test1.channels.dsb.apps.energyweb.iam.ewc';
    let channelManagerService: ChannelManagerService;

    const authenticatedUser1 = {
        did: 'did:ethr:volta:0x46646c919278e1Dac6ef3B02BC520A82B8FaA596',
        verifiedRoles: [
            {
                name: 'channelcreation',
                namespace: 'channelcreation.roles.dsb.apps.energyweb.iam.ewc'
            }
        ]
    };
    const authenticatedUser2 = {
        did: 'did:ethr:volta:0x46646c919278e1Dac6ef3B02BC520A82B8FaA596',
        verifiedRoles: [
            {
                name: 'channelcreation',
                namespace: 'channelcreation.roles.dsb.apps.energyweb.iam.ewc'
            },
            {
                name: 'user',
                namespace: 'user.roles.dsb.apps.energyweb.iam.ewc'
            }
        ]
    };
    const authenticatedUser3 = {
        did: 'did:ethr:volta:0x46646c919278e1Dac6ef3B02BC520A82B8FaA237',
        verifiedRoles: [
            {
                name: 'user',
                namespace: 'user.roles.dsb.apps.energyweb.iam.ewc'
            }
        ]
    };
    const authenticatedUser4 = {
        did: 'did:ethr:volta:0x46646c919278e1Dac6ef3B02BC520A82B8FaA237',
        verifiedRoles: [] as any[]
    };

    const authGuard: CanActivate = {
        canActivate: (context: ExecutionContext) => {
            const req = context.switchToHttp().getRequest();
            const userNo = req.get('User-No');
            if (userNo === '1') req.user = authenticatedUser1;
            if (userNo === '2') req.user = authenticatedUser2;
            if (userNo === '3') req.user = authenticatedUser3;
            if (userNo === '4') req.user = authenticatedUser4;
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
        try {
            await channelManagerService.remove(fqcn);
        } catch (error) {}
    });

    it('should not create a channel without channelcreation role', async () => {
        await request(app)
            .post('/channel')
            .send({ fqcn })
            .set('User-No', '3')
            .expect(HttpStatus.FORBIDDEN);
    });

    it('should not create a channel with invalid fqcn', async () => {
        // not allowed characters
        await request(app)
            .post('/channel')
            .send({ fqcn: 'test!@#.channels.dsb.apps.energyweb.iam.ewc' })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);

        // more than 16 character
        await request(app)
            .post('/channel')
            .send({ fqcn: 'test1234567890123.channels.dsb.apps.energyweb.iam.ewc' })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);
    });

    it('should not create a channel with invalid metadata', async () => {
        // invalid topics
        await request(app)
            .post('/channel')
            .send({ fqcn, topics: [{}] })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);
        // invalid admins
        await request(app)
            .post('/channel')
            .send({ fqcn, admins: [] })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);
        // invalid publishers
        await request(app)
            .post('/channel')
            .send({ fqcn, publishers: [] })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);
        // invalid subscribers
        await request(app)
            .post('/channel')
            .send({ fqcn, subscribers: [] })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);
        // invalid maxMsgAge
        await request(app)
            .post('/channel')
            .send({ fqcn, maxMsgAge: '' })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);
        // invalid maxMsgSize
        await request(app)
            .post('/channel')
            .send({ fqcn, maxMsgSize: '' })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);
    });

    it('should not create a channel with invalid schema', async () => {
        // invalid json
        await request(app)
            .post('/channel')
            .send({
                fqcn,
                topics: [
                    {
                        namespace: 'testTopic',
                        schema: '{"type": object","properties": {"data": {"type": "string"}},"required": ["data"],"additionalProperties": false}'
                    }
                ]
            })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);

        // unknown keyword
        await request(app)
            .post('/channel')
            .send({
                fqcn,
                topics: [
                    {
                        namespace: 'testTopic',
                        schema: '{"typex": "object","properties": {"data": {"type": "string"}},"required": ["data"],"additionalProperties": false}'
                    }
                ]
            })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);

        // not allowed values
        await request(app)
            .post('/channel')
            .send({
                fqcn,
                topics: [
                    {
                        namespace: 'testTopic',
                        schema: '{"type": "objectx","properties": {"data": {"type": "string"}},"required": ["data"],"additionalProperties": false}'
                    }
                ]
            })
            .set('User-No', '1')
            .expect(HttpStatus.BAD_REQUEST);
    });

    it('should create a channel', async () => {
        await request(app)
            .post('/channel')
            .send({ fqcn })
            .set('User-No', '1')
            .expect(HttpStatus.CREATED);
    });

    it('should not be able to modify a channel without having user role', async () => {
        await request(app)
            .patch('/channel')
            .send({
                fqcn,
                publishers: [authenticatedUser3.did],
                subscribers: [authenticatedUser3.did]
            })
            .set('User-No', '1')
            .expect(HttpStatus.FORBIDDEN);
    });

    it('should not be able to modify a channel without being admin', async () => {
        await request(app)
            .patch('/channel')
            .send({
                fqcn,
                publishers: [authenticatedUser3.did],
                subscribers: [authenticatedUser3.did]
            })
            .set('User-No', '3')
            .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should not be able to modify a channel with invalid schema (JSON)', async () => {
        // invalid json
        await request(app)
            .patch('/channel')
            .send({
                fqcn,
                topics: [
                    {
                        namespace: 'testTopic',
                        schema: '{"type": object","properties": {"data": {"type": "string"}},"required": ["data"],"additionalProperties": false}'
                    }
                ]
            })
            .set('User-No', '2')
            .expect(HttpStatus.BAD_REQUEST);

        // unknown keyword
        await request(app)
            .patch('/channel')
            .send({
                fqcn,
                topics: [
                    {
                        namespace: 'testTopic',
                        schema: '{"typex": "object","properties": {"data": {"type": "string"}},"required": ["data"],"additionalProperties": false}'
                    }
                ]
            })
            .set('User-No', '2')
            .expect(HttpStatus.BAD_REQUEST);

        // not allowed values
        await request(app)
            .patch('/channel')
            .send({
                fqcn,
                topics: [
                    {
                        namespace: 'testTopic',
                        schema: '{"type": "objectx","properties": {"data": {"type": "string"}},"required": ["data"],"additionalProperties": false}'
                    }
                ]
            })
            .set('User-No', '2')
            .expect(HttpStatus.BAD_REQUEST);
    });

    it('should not be able to modify a channel with invalid schema (XML)', async () => {
        await request(app)
            .patch('/channel')
            .send({
                fqcn,
                topics: [
                    {
                        namespace: 'testTopic',
                        schemaType: 'XSD',
                        schema: 'xml version="1.0"?> <xsd:schema targetNamespace="http://www.loc.gov/MARC21/slim" xmlns="http://www.loc.gov/MARC21/slim" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified" attributeFormDefault="unqualified" version="1.1" xml:lang="en"> <xsd:annotation> <xsd:documentation> MARCXML: The MARC 21 XML Schema Prepared by Corey Keith May 21, 2002 - Version 1.0 - Initial Release ********************************************** Changes. August 4, 2003 - Version 1.1 - Removed import of xml namespace and the use of xml:space="preserve" attributes on the leader and controlfields. Whitespace preservation in these subfields is accomplished by the use of xsd:whiteSpace value="preserve" May 21, 2009 - Version 1.2 - in subfieldcodeDataType the pattern "[\\da-z!&quot;#$%&amp;\'()*+,-./:;&lt;=&gt;?{}_^`~\\[\\]\\]{1}" changed to: "[\\dA-Za-z!&quot;#$%&amp;\'()*+,-./:;&lt;=&gt;?{}_^`~\\[\\]\\]{1}" i.e "A-Z" added after "[\\d" before "a-z" to allow upper case. This change is for consistency with the documentation. ************************************************************ This schema supports XML markup of MARC21 records as specified in the MARC documentation (see www.loc.gov). It allows tags with alphabetics and subfield codes that are symbols, neither of which are as yet used in the MARC 21 communications formats, but are allowed by MARC 21 for local data. The schema accommodates all types of MARC 21 records: bibliographic, holdings, bibliographic with embedded holdings, authority, classification, and community information. </xsd:documentation> </xsd:annotation> <xsd:element name="record" type="recordType" nillable="true" id="record.e"> <xsd:annotation> <xsd:documentation>record is a top level container element for all of the field elements which compose the record</xsd:documentation> </xsd:annotation> </xsd:element> <xsd:element name="collection" type="collectionType" nillable="true" id="collection.e"> <xsd:annotation> <xsd:documentation>collection is a top level container element for 0 or many records</xsd:documentation> </xsd:annotation> </xsd:element> <xsd:complexType name="collectionType" id="collection.ct"> <xsd:sequence minOccurs="0" maxOccurs="unbounded"> <xsd:element ref="record"/> </xsd:sequence> <xsd:attribute name="id" type="idDataType" use="optional"/> </xsd:complexType> <xsd:complexType name="recordType" id="record.ct"> <xsd:sequence minOccurs="0"> <xsd:element name="leader" type="leaderFieldType"/> <xsd:element name="controlfield" type="controlFieldType" minOccurs="0" maxOccurs="unbounded"/> <xsd:element name="datafield" type="dataFieldType" minOccurs="0" maxOccurs="unbounded"/> </xsd:sequence> <xsd:attribute name="type" type="recordTypeType" use="optional"/> <xsd:attribute name="id" type="idDataType" use="optional"/> </xsd:complexType> <xsd:simpleType name="recordTypeType" id="type.st"> <xsd:restriction base="xsd:NMTOKEN"> <xsd:enumeration value="Bibliographic"/> <xsd:enumeration value="Authority"/> <xsd:enumeration value="Holdings"/> <xsd:enumeration value="Classification"/> <xsd:enumeration value="Community"/> </xsd:restriction> </xsd:simpleType> <xsd:complexType name="leaderFieldType" id="leader.ct"> <xsd:annotation> <xsd:documentation>MARC21 Leader, 24 bytes</xsd:documentation> </xsd:annotation> <xsd:simpleContent> <xsd:extension base="leaderDataType"> <xsd:attribute name="id" type="idDataType" use="optional"/> </xsd:extension> </xsd:simpleContent> </xsd:complexType> <xsd:simpleType name="leaderDataType" id="leader.st"> <xsd:restriction base="xsd:string"> <xsd:whiteSpace value="preserve"/> <xsd:pattern value="[\\d ]{5}[\\dA-Za-z ]{1}[\\dA-Za-z]{1}[\\dA-Za-z ]{3}(2| )(2| )[\\d ]{5}[\\dA-Za-z ]{3}(4500| )"/> </xsd:restriction> </xsd:simpleType> <xsd:complexType name="controlFieldType" id="controlfield.ct"> <xsd:annotation> <xsd:documentation>MARC21 Fields 001-009</xsd:documentation> </xsd:annotation> <xsd:simpleContent> <xsd:extension base="controlDataType"> <xsd:attribute name="id" type="idDataType" use="optional"/> <xsd:attribute name="tag" type="controltagDataType" use="required"/> </xsd:extension> </xsd:simpleContent> </xsd:complexType> <xsd:simpleType name="controlDataType" id="controlfield.st"> <xsd:restriction base="xsd:string"> <xsd:whiteSpace value="preserve"/> </xsd:restriction> </xsd:simpleType> <xsd:simpleType name="controltagDataType" id="controltag.st"> <xsd:restriction base="xsd:string"> <xsd:whiteSpace value="preserve"/> <xsd:pattern value="00[1-9A-Za-z]{1}"/> </xsd:restriction> </xsd:simpleType> <xsd:complexType name="dataFieldType" id="datafield.ct"> <xsd:annotation> <xsd:documentation>MARC21 Variable Data Fields 010-999</xsd:documentation> </xsd:annotation> <xsd:sequence maxOccurs="unbounded"> <xsd:element name="subfield" type="subfieldatafieldType"/> </xsd:sequence> <xsd:attribute name="id" type="idDataType" use="optional"/> <xsd:attribute name="tag" type="tagDataType" use="required"/> <xsd:attribute name="ind1" type="indicatorDataType" use="required"/> <xsd:attribute name="ind2" type="indicatorDataType" use="required"/> </xsd:complexType> <xsd:simpleType name="tagDataType" id="tag.st"> <xsd:restriction base="xsd:string"> <xsd:whiteSpace value="preserve"/> <xsd:pattern value="(0([1-9A-Z][0-9A-Z])|0([1-9a-z][0-9a-z]))|(([1-9A-Z][0-9A-Z]{2})|([1-9a-z][0-9a-z]{2}))"/> </xsd:restriction> </xsd:simpleType> <xsd:simpleType name="indicatorDataType" id="ind.st"> <xsd:restriction base="xsd:string"> <xsd:whiteSpace value="preserve"/> <xsd:pattern value="[\\da-z ]{1}"/> </xsd:restriction> </xsd:simpleType> <xsd:complexType name="subfieldatafieldType" id="subfield.ct"> <xsd:simpleContent> <xsd:extension base="subfieldDataType"> <xsd:attribute name="id" type="idDataType" use="optional"/> <xsd:attribute name="code" type="subfieldcodeDataType" use="required"/> </xsd:extension> </xsd:simpleContent> </xsd:complexType> <xsd:simpleType name="subfieldDataType" id="subfield.st"> <xsd:restriction base="xsd:string"> <xsd:whiteSpace value="preserve"/> </xsd:restriction> </xsd:simpleType> <xsd:simpleType name="subfieldcodeDataType" id="code.st"> <xsd:restriction base="xsd:string"> <xsd:whiteSpace value="preserve"/> <xsd:pattern value="[\\dA-Za-z!&quot;#$%&amp;\'()*+,-./:;&lt;=&gt;?{}_^`~\\[\\]\\\\]{1}"/> <!-- "A-Z" added after "\\d" May 21, 2009 --> </xsd:restriction> </xsd:simpleType> <xsd:simpleType name="idDataType" id="id.st"> <xsd:restriction base="xsd:ID"/> </xsd:simpleType> </xsd:schema>'
                    }
                ]
            })
            .set('User-No', '2')
            .expect(HttpStatus.BAD_REQUEST);
    });

    it('should modify a channel', async () => {
        await request(app)
            .patch('/channel')
            .send({
                fqcn,
                publishers: [authenticatedUser3.did],
                subscribers: [authenticatedUser3.did]
            })
            .set('User-No', '2')
            .expect(HttpStatus.OK);
    });

    it('should remove "$schema", "$id" and "version" from schema', async () => {
        await request(app)
            .patch('/channel')
            .send({
                fqcn,
                topics: [
                    {
                        namespace: 'testTopic',
                        schema: '{"$schema":"testSchema","$id":"testId","title":"testTitle","version":"testVersion","type":"object","properties":{"data":{"type":"string"}},"required":["data"],"additionalProperties":false}'
                    }
                ]
            })
            .set('User-No', '2')
            .expect(HttpStatus.OK);

        await sleep(1000);

        const channel = (
            await request(app).get(`/channel/${fqcn}`).set('User-No', '3').expect(HttpStatus.OK)
        ).body;

        const includesSpecialProperties = channel.topics.some((topic: any) => {
            if (topic.namespace === 'testTopic') {
                if (
                    topic.schema.hasOwnProperty('$schema') ||
                    topic.schema.hasOwnProperty('$id') ||
                    topic.schema.hasOwnProperty('version')
                )
                    return true;
            }
            return false;
        });

        expect(includesSpecialProperties, 'it should not include "$schema", "$id" and "version"').to
            .be.false;
    });

    it('should not be able to get accessible channels without having user role', async () => {
        await request(app).get('/channel/pubsub').set('User-No', '4').expect(HttpStatus.FORBIDDEN);
    });

    it('should not be able to get channel metadata without being publisher or subscriber', async () => {
        await request(app)
            .get(`/channel/${fqcn}`)
            .set('User-No', '2')
            .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should get accessible channels', async () => {
        const channels = (
            await request(app).get('/channel/pubsub').set('User-No', '3').expect(HttpStatus.OK)
        ).body;

        const includesCreatedChannel = channels.some((channel: any) => channel.fqcn === fqcn);

        expect(includesCreatedChannel, 'it should include created channel').to.be.true;
    });

    it('should get channel metadata', async () => {
        const channel = (
            await request(app).get(`/channel/${fqcn}`).set('User-No', '3').expect(HttpStatus.OK)
        ).body;

        expect(channel).to.include({ fqcn }, 'fqcn should match');

        expect(channel).to.deep.include(
            { admins: ['did:ethr:volta:0x46646c919278e1Dac6ef3B02BC520A82B8FaA596'] },
            'should have creator as admin'
        );

        expect(channel).to.deep.include(
            { publishers: ['did:ethr:volta:0x46646c919278e1Dac6ef3B02BC520A82B8FaA237'] },
            'should have modified publishers'
        );

        expect(channel).to.deep.include(
            { subscribers: ['did:ethr:volta:0x46646c919278e1Dac6ef3B02BC520A82B8FaA237'] },
            'should have modified subscribers'
        );
    });

    it('should not be able to remove a channel without having user role', async () => {
        await request(app)
            .delete(`/channel/${fqcn}`)
            .set('User-No', '1')
            .expect(HttpStatus.FORBIDDEN);
    });

    it('should not be able to remove a channel without being admin', async () => {
        await request(app)
            .delete(`/channel/${fqcn}`)
            .set('User-No', '3')
            .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should remove a channel', async () => {
        await request(app).delete(`/channel/${fqcn}`).set('User-No', '2').expect(HttpStatus.OK);
    });
});
