import { defineConfig } from "prisma/config";

let dbUrl = process.env.DATABASE_URL;

if (dbUrl && dbUrl.includes('${')) {
  dbUrl = dbUrl.replace(/\$\{(\w+)\}/g, (_, key) => process.env[key] || '');
}

if (!dbUrl) {
  const dbType = process.env.DB_TYPE || 'postgresql';
  const dbUser = process.env.DB_USER || '';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbHost = process.env.DB_HOST || '';
  const dbPort = process.env.DB_PORT || '';
  const dbName = process.env.DB_NAME || '';
  const dbSchema = process.env.DB_SCHEMA || '';

  dbUrl = `${dbType}://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}${dbSchema ? `?schema=${dbSchema}` : ''}`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: dbUrl,
  },
});
