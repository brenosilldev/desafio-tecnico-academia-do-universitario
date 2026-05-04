"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStatus = exports.PrismaClient = void 0;
class PrismaClient {
    $connect = jest.fn();
    $disconnect = jest.fn();
    task = {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        aggregate: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };
}
exports.PrismaClient = PrismaClient;
exports.TaskStatus = {
    TODO: 'TODO',
    IN_PROGRESS: 'IN_PROGRESS',
    DONE: 'DONE',
};
//# sourceMappingURL=prisma-client.js.map