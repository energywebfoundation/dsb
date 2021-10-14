import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

import { AppModule } from './app.module';
import { ExceptionsFilter } from './exceptions.filter';
import { GlobalMiddleware } from './global.middleware';

const { combine, timestamp, printf } = winston.format;
const logFormat = printf((props) => {
    const { timestamp, level, context, message, request } = props;
    let _uuid,
        _context = context;

    if (request) {
        _uuid = request.app.locals.uuid;
        const method = request.method.toUpperCase();
        const url = request.url.split('?')[0];
        _context = `${method} ${url}`;
    }

    return (
        `${timestamp.replace('T', ' ')} - ` +
        `${_uuid ?? 'SysLog'} - ` +
        `${level?.toUpperCase() ?? 'Undefined Level'} - ` +
        `${_context ?? 'Undefined Context'} - ` +
        `${message ?? 'Undefined Message'}`
    );
});

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: WinstonModule.createLogger({
            levels: {
                error: 0,
                warn: 1,
                info: 2,
                verbose: 3,
                debug: 4
            },
            format: combine(timestamp(), logFormat),
            transports: [new winston.transports.Console()]
        })
    });
    app.use(GlobalMiddleware);
    app.useGlobalFilters(new ExceptionsFilter());
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    app.enableShutdownHooks();

    const logger = app.get(Logger);
    console.log = (...args) => logger.log.call(logger, ...args);
    console.error = (...args) => logger.error.call(logger, ...args);
    console.warn = (...args) => logger.warn.call(logger, ...args);
    console.info = (...args) => logger.log.call(logger, ...args);
    console.debug = (...args) => logger.debug.call(logger, ...args);

    const port = process.env.PORT ?? 3000;
    logger.log({
        context: 'Bootstrap',
        message: `Message Broker listening on port ${port}`
    });

    if (process.env.WITH_SWAGGER === 'true') {
        const options = new DocumentBuilder()
            .setTitle('DSB Message Broker API')
            .setDescription('Swagger documentation for the DSB Message Broker API')
            .setVersion('0.1')
            .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
            .build();

        const document = SwaggerModule.createDocument(app, options);
        SwaggerModule.setup('swagger', app, document);

        logger.log({
            context: 'Bootstrap',
            message: `Swagger documentation available on http://localhost:${port}/swagger`
        });
    }

    await app.listen(port);
}

bootstrap();
