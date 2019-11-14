import * as dotenv from 'dotenv';

dotenv.config();

export const environment = {
  port: Number(process.env.PORT) || 3000,
  production: process.env.NODE_ENV || false,
  prisma: process.env.PRISMA || '',
  secret: process.env.SECRET || '',
  salt: Number(process.env.SALT) || 1,
  database: process.env.DATABASE_URL ? `${process.env.DATABASE_URL}?ssl=1` : '',
};
