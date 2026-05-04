import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.useGlobalPipes(
        new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('api');

    const config = new DocumentBuilder()
        .setTitle('Kanban API')
        .setDescription('API REST para gerenciamento de tarefas no quadro Kanban')
        .setVersion('1.0')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(process.env.PORT ?? 3333);
    console.log(`Swagger available at http://localhost:${process.env.PORT ?? 3333}/api/docs`);
}
bootstrap();
 