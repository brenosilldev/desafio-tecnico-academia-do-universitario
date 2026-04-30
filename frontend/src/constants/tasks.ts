import { Task } from '@/types/task'

export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Criar protótipo de alta fidelidade',
    description:
      'Desenvolver os wireframes e protótipos no Figma para validação com os stakeholders antes do desenvolvimento.',
    status: 'todo',
    createdAt: '2026-04-26',
  },
  {
    id: '2',
    title: 'Configurar pipeline de CI/CD',
    description:
      'Automatizar o processo de build, testes e deploy usando GitHub Actions com ambientes de staging e produção.',
    status: 'todo',
    createdAt: '2026-04-23',
  },
  {
    id: '3',
    title: 'Definir paleta de cores do projeto',
    description:
      'Escolher as cores primárias e secundárias para o design system do produto, garantindo acessibilidade WCAG AA.',
    status: 'in_progress',
    createdAt: '2026-04-25',
  },
  {
    id: '4',
    title: 'Implementar autenticação JWT',
    description:
      'Configurar o fluxo de login e refresh token usando JWT, com suporte a OAuth2 pelo Google e GitHub.',
    status: 'in_progress',
    createdAt: '2026-04-24',
  },
  {
    id: '5',
    title: 'Modelagem do banco de dados',
    description:
      'Criar o schema do banco PostgreSQL com todas as entidades, relacionamentos e índices necessários para o projeto.',
    status: 'done',
    createdAt: '2026-04-21',
  },
  {
    id: '6',
    title: 'Setup do repositório e estrutura de pastas',
    description:
      'Configurar o repositório Git com convenções de branch, commit hooks, linting e formatação de código.',
    status: 'done',
    createdAt: '2026-04-10',
  },
]
