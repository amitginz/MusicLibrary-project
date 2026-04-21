import { env } from './config/env';
import { connectDB } from './db/connect';
import app from './app';

async function main() {
  await connectDB();
  app.listen(Number(env.PORT), () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
  });
}

main();
