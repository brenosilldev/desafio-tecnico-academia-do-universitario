# Desafio Técnico Full Stack — Academia do Universitário

Olá! Este é o desafio técnico da [Academia do Universitário (AU)](https://www.academiadouniversitario.com.br/) para a vaga de **Desenvolvedor(a) Full Stack Pleno**, com foco em backend.

## O desafio

Construir uma aplicação de **gestão de tarefas (To-Do)** com:

- um **formulário de cadastro** simples de tarefa, e
- um **quadro Kanban** que permita movimentar tarefas entre colunas, mudando seu status.

O objetivo não é apenas "fazer funcionar" — queremos avaliar como você modela o domínio, organiza camadas no backend, integra o frontend ao backend e cuida da qualidade do código.

## Requisitos funcionais

Estes itens são **obrigatórios**:

- **Cadastro de tarefa**: formulário simples no frontend que cria a tarefa via API. Sugestão mínima de campos: `título`, `descrição` e `status inicial`. Você pode estender se julgar relevante.
- **Quadro Kanban**: visualização das tarefas agrupadas por status (ex.: `A fazer`, `Em andamento`, `Concluído`) com **mudança de status** por drag-and-drop ou por ação equivalente (ex.: botão/dropdown).
- **Persistência via API**: o estado das tarefas precisa estar no backend, não apenas no estado do frontend.

## Stack obrigatória

Backend:
- **NestJS**
- **Prisma ORM**

Frontend:
- **Next.js 15+** rodando como **SPA**
- **Tailwind CSS**
- **TanStack Query**

Banco de dados fica a seu critério. PostgreSQL via Docker é o caminho mais comum e o que recomendamos.

## Itens desejáveis (diferenciais)

Não são obrigatórios, mas contam pontos:

- **Uso de IA documentado**: se você usou alguma ferramenta de IA durante o desafio, conte no seu README **qual ferramenta**, **como usou** e inclua **pelo menos um exemplo de prompt** que tenha sido relevante.
- **Gráfico** mostrando a distribuição de tarefas por status.
- **Arquitetura hexagonal ou em camadas** no backend, com separação clara entre domínio, casos de uso e infraestrutura.
- **Pirâmide de testes**: cobertura em mais de um nível (unitários, integração e, se possível, e2e), com a base sendo testes unitários.

## Layout

O design de referência está no Figma:

https://www.figma.com/design/qZJGI8XFDk4dAUHsh102Vq/Teste-UI?node-id=0-1&t=6Od14pbwlM9jKhhZ-1

Pequenas adaptações fiéis ao espírito do design são bem-vindas — não precisa ser pixel-perfect, mas espera-se fidelidade visual razoável.

## Critérios de avaliação

Vamos olhar especialmente para:

Backend
- Modelagem do domínio e schema com Prisma.
- Organização em camadas (controllers, serviços, repositórios, domínio).
- Qualidade do código: nomes, coesão, ausência de acoplamento desnecessário.
- Tratamento de erros e validação de entrada.
- Testes — presença, qualidade e cobertura proporcional ao escopo.

Frontend
- Uso correto de **TanStack Query** (cache, invalidação, estados de loading/erro).
- Estrutura de componentes e estilo com **Tailwind**.
- Fidelidade ao layout do Figma.
- Experiência ao mudar status no Kanban (feedback visual, otimismo de UI quando fizer sentido).

Transversais
- Clareza do README de entrega.
- Uso consciente de IA (quando aplicável).
- Histórico de commits que conte a história do desenvolvimento.

## O que esperamos no seu README

Quando enviar, seu README deve responder ao avaliador, no mínimo:

- **Como rodar**: variáveis de ambiente necessárias, comandos para subir o banco, rodar migrations/seed, iniciar o backend e o frontend.
- **Como rodar os testes**: comando(s) por nível (unitários / integração / e2e, conforme o que tiver).
- **Decisões técnicas**: escolhas de arquitetura, bibliotecas adicionais, trade-offs que você tomou conscientemente.
- **Uso de IA** (se aplicável): ferramentas usadas, como usou e exemplo(s) de prompt.

## Entrega

1. Crie um **repositório público no GitHub** com sua solução.
2. Envie o link por email para **felipe@academiadouniversitario.com.br** com o assunto: `[Desafio AU] Seu Nome`.

**Prazo: 7 dias corridos** a partir do recebimento do desafio.

## Dúvidas

Qualquer dúvida sobre o escopo, escolha de tecnologias ou critérios, escreva para **felipe@academiadouniversitario.com.br**.

Boa sorte!