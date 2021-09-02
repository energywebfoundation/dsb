import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';

import { AppModule } from './app.module';

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    const app = await NestFactory.create(AppModule);
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

    const port = process.env.PORT ?? 3000;

    logger.log(`Message Broker listening on port ${port}`);

    if (process.env.WITH_SWAGGER === 'true') {
        const options = new DocumentBuilder()
            .setTitle('DSB Message Broker API')
            .setDescription('Swagger documentation for the DSB Message Broker API')
            .setVersion('0.1')
            .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
            .build();

        const document = SwaggerModule.createDocument(app, options);
        SwaggerModule.setup('swagger', app, document);
        logger.log(`Swagger documentation available on http://localhost:${port}/swagger`);
    }

    await app.listen(port);
}

bootstrap();
