process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/millionblogs_test?schema=public';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-16-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-16-chars';
process.env.LOG_LEVEL = 'silent';
process.env.LOG_FORMAT = 'json';
