import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

import * as compression from 'compression';
import * as helmet from 'helmet';
import * as passport from 'passport';
import * as session from 'express-session';
import * as pgSessionFactory from 'connect-pg-simple';
import * as pg from 'pg';

import { environment } from '@env';
import { AppModule } from 'app.module';
import { LocalGuard } from 'common/guards';
import { LoginExceptionFilter } from 'common/errors/login.filter';

const pgSession = pgSessionFactory(session);
const pgPool = environment.database
  ? new pg.Pool({
      connectionString: environment.database,
    })
  : undefined;

const store = environment.database
  ? new pgSession({
      pool: pgPool,
    })
  : undefined;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: [environment.loginRedirect],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });
  app.use(helmet());
  app.use(compression());

  app.set('trust proxy', 1);
  app.use(
    session({
      secret: environment.secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: environment.production,
        httpOnly: true,
        maxAge: 1 * 24 * 60 * 60 * 1000,
      },
      rolling: true,
      store,
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new LocalGuard(reflector));
  app.useGlobalFilters(new LoginExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    })
  );

  await app.listen(environment.port);
}

bootstrap();
