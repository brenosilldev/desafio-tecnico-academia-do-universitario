# `common/`

Código transversal usado por toda a aplicação. Hoje contém apenas o filtro global de exceções.

---

## `filters/http-exception.filter.ts`

Filtro registrado em `main.ts` via `app.useGlobalFilters(new HttpExceptionFilter())`. Captura **qualquer** exceção e devolve um JSON consistente.

### Decorator

```ts
@Catch()
```

Sem argumento — pega `HttpException`, `Error` e qualquer `unknown` lançado.

### Resposta padronizada

Para qualquer erro:

```json
{
  "statusCode": 404,
  "message": "Tarefa com id \"abc\" não encontrada",
  "path": "/api/tasks/abc",
  "timestamp": "2026-05-03T13:38:01.234Z"
}
```

### Como decide o status e a mensagem

| Tipo de exceção                            | Status                  | Mensagem                                                   |
|--------------------------------------------|-------------------------|------------------------------------------------------------|
| `HttpException` com `getResponse()` string | `exception.getStatus()` | a string                                                   |
| `HttpException` com `getResponse()` objeto | `exception.getStatus()` | `(response as any).message` (string ou string[])           |
| Qualquer outro `Error`                     | `500`                   | `"Erro interno no servidor"` + log do stack via `Logger`   |
| Qualquer `unknown` não-Error               | `500`                   | `"Erro interno no servidor"`                               |

### Por que `string | string[]` na mensagem

O `ValidationPipe` retorna `string[]` (uma mensagem por campo inválido). Mantendo o tipo união, o frontend recebe a mesma estrutura tanto para erros simples quanto para múltiplos erros de validação.

---

## Logging

```ts
private readonly logger = new Logger(HttpExceptionFilter.name);
```

Apenas exceções **não-HTTP** (ou seja, bugs reais e não erros semânticos esperados) são logadas com `logger.error(...)`. `NotFoundException`, `BadRequestException`, etc., não poluem os logs.

---

## Quando adicionar coisas aqui

Esta pasta é para **infraestrutura transversal**: filtros, interceptors, guards globais, decorators customizados, pipes reutilizáveis, etc. Coisas que não pertencem a um módulo específico.

Coisas que NÃO devem entrar:
- Lógica de negócio (vai em `tasks/application` ou em um módulo próprio)
- Tipos de domínio (vai em `tasks/domain`)
- Acesso a banco (vai em `prisma/`)
