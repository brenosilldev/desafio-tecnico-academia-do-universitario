import { HttpExceptionFilter } from '../../../src/common/filters/http-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';

const makeMockHost = (url = '/api/tasks'): ArgumentsHost => {
  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const mockRequest = { url };
  return {
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getRequest: jest.fn().mockReturnValue(mockRequest),
    }),
  } as unknown as ArgumentsHost;
};

const getJsonPayload = (host: ArgumentsHost) => {
  const ctx = (host.switchToHttp as jest.Mock)();
  return (ctx.getResponse() as any).json.mock.calls[0][0];
};

const getStatusCode = (host: ArgumentsHost): number => {
  const ctx = (host.switchToHttp as jest.Mock)();
  return (ctx.getResponse() as any).status.mock.calls[0][0];
};

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  describe('HttpException', () => {
    it('retorna status 404 para NotFoundException', () => {
      const host = makeMockHost();
      filter.catch(new HttpException('Não encontrado', HttpStatus.NOT_FOUND), host);
      expect(getStatusCode(host)).toBe(404);
    });

    it('retorna status 400 para BadRequestException', () => {
      const host = makeMockHost();
      filter.catch(new HttpException('Requisição inválida', HttpStatus.BAD_REQUEST), host);
      expect(getStatusCode(host)).toBe(400);
    });

    it('retorna status 422 para UnprocessableEntityException', () => {
      const host = makeMockHost();
      filter.catch(new HttpException('Entidade inválida', HttpStatus.UNPROCESSABLE_ENTITY), host);
      expect(getStatusCode(host)).toBe(422);
    });

    it('inclui mensagem string na resposta', () => {
      const host = makeMockHost();
      filter.catch(new HttpException('Mensagem de erro', HttpStatus.NOT_FOUND), host);
      expect(getJsonPayload(host).message).toBe('Mensagem de erro');
    });

    it('inclui mensagem como array quando resposta é objeto com message array', () => {
      const host = makeMockHost();
      const exception = new HttpException(
        { message: ['campo obrigatório', 'formato inválido'] },
        HttpStatus.BAD_REQUEST,
      );
      filter.catch(exception, host);
      expect(getJsonPayload(host).message).toEqual(['campo obrigatório', 'formato inválido']);
    });

    it('inclui statusCode correto no JSON', () => {
      const host = makeMockHost();
      filter.catch(new HttpException('Erro', HttpStatus.FORBIDDEN), host);
      expect(getJsonPayload(host).statusCode).toBe(403);
    });

    it('inclui path da requisição no JSON', () => {
      const host = makeMockHost('/api/tasks/123');
      filter.catch(new HttpException('Não encontrado', HttpStatus.NOT_FOUND), host);
      expect(getJsonPayload(host).path).toBe('/api/tasks/123');
    });

    it('inclui timestamp ISO no JSON', () => {
      const host = makeMockHost();
      filter.catch(new HttpException('Erro', HttpStatus.BAD_REQUEST), host);
      const { timestamp } = getJsonPayload(host);
      expect(typeof timestamp).toBe('string');
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  describe('Exceções desconhecidas', () => {
    it('retorna status 500 para Error genérico', () => {
      const host = makeMockHost();
      filter.catch(new Error('Erro inesperado'), host);
      expect(getStatusCode(host)).toBe(500);
    });

    it('retorna mensagem padrão para erros internos', () => {
      const host = makeMockHost();
      filter.catch(new Error('crash'), host);
      expect(getJsonPayload(host).message).toBe('Erro interno no servidor');
    });

    it('retorna status 500 para exceção não-Error', () => {
      const host = makeMockHost();
      filter.catch('string exception', host);
      expect(getStatusCode(host)).toBe(500);
    });

    it('inclui path mesmo para erros desconhecidos', () => {
      const host = makeMockHost('/api/test');
      filter.catch(new Error('crash'), host);
      expect(getJsonPayload(host).path).toBe('/api/test');
    });
  });
});
