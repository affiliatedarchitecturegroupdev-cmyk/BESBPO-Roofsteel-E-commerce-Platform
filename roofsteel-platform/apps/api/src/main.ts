import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Helmet sets security-related HTTP headers: HSTS, CSP frame-ancestors, X-Content-Type-Options,
  // X-Frame-Options (DENY), etc. See guidelines/11-security-and-compliance.md.
  app.use(helmet());

  app.enableCors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix("v1");

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`Roofsteel API listening on :${port}`);
}
bootstrap();
