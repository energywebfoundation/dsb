import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import fs from 'fs';

import { AppModule } from './app.module';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Yaml = require('json-to-pretty-yaml');

export const bootstrap = async () => {
    const moduleFixture = await Test.createTestingModule({
        imports: [AppModule]
    }).compile();

    const app = moduleFixture.createNestApplication();

    const options = new DocumentBuilder()
        .setTitle('Origin Organization I-REC API')
        .setDescription('Swagger documentation for the DSB')
        .setVersion('0.1')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
        .build();

    const document = SwaggerModule.createDocument(app, options);

    if (!document.components.schemas) {
        document.components.schemas = {};
    }

    fs.writeFileSync(process.argv[2], Yaml.stringify(document));

    process.exit(0);
};

(async () => {
    await bootstrap();
})();
