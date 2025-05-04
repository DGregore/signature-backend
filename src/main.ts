import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Importar ValidationPipe

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para permitir requisições do frontend (ajuste a origem se necessário)
  app.enableCors({
    origin: 'http://localhost:4200', // Ou a URL onde seu frontend está rodando
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Habilitar ValidationPipe globalmente (se ainda não estiver)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove propriedades não definidas no DTO
    forbidNonWhitelisted: true, // Lança erro se propriedades não definidas forem enviadas
    transform: true, // Transforma o payload para instâncias do DTO
  }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
