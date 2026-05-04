# `prisma/`

Encapsula o cliente Prisma como um serviço NestJS.

---

## Conteúdo

```
prisma/
├── prisma.service.ts    # Estende PrismaClient + lifecycle hooks
└── prisma.module.ts     # @Global() — exporta PrismaService
```

---

## `PrismaService`

```ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ datasourceUrl: process.env.DATABASE_URL });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
```

- **Estende `PrismaClient`** — qualquer adapter pode usar `prismaService.task.findMany(...)`, `prismaService.$transaction(...)`, etc.
- **`onModuleInit`** abre a conexão quando o NestJS inicializa o módulo.
- **`onModuleDestroy`** fecha a conexão ao encerrar o app (importante para `SIGTERM` em produção e para `app.close()` nos testes e2e).
- O `PrismaClient` importado vem de `../../generated/prisma` (output customizado em `schema.prisma`).

---

## `PrismaModule`

```ts
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- Marcado como **`@Global()`** — qualquer outro módulo pode injetar `PrismaService` sem precisar importar `PrismaModule` repetidamente.
- Importado uma única vez em `AppModule`.

---

## Por que esse wrapper?

- Centraliza o lifecycle (connect / disconnect) em um lugar.
- Permite estender comportamento (logging, soft-delete middleware, etc.) sem tocar nos adapters.
- Torna o Prisma injetável via DI do Nest, alinhado com o padrão do framework.
