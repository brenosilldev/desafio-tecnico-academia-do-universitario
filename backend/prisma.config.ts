import "dotenv/config";
import { defineConfig } from "prisma/config";

// Em Prisma 6, a URL do datasource é definida no schema.prisma
// (`url = env("DATABASE_URL")`). Aqui só apontamos schema e migrations.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
