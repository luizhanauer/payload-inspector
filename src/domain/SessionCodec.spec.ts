// src/domain/SessionCodec.spec.ts
import { describe, it, expect } from 'vitest';
import { SessionCodec, SessionData, EncodedString } from './SessionCodec';

describe('SessionCodec', () => {
  it('deve codificar um objeto de dados para uma string base64 segura', () => {
    const codec = new SessionCodec();
    const rawData: Record<string, unknown> = { key: 'value', id: 123 };
    const session = new SessionData(rawData);

    const encoded: EncodedString = codec.encode(session);
    const result: string = encoded.retrieve();

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('deve decodificar uma string base64 de volta para o objeto de dados original', () => {
    const codec = new SessionCodec();
    const originalData: Record<string, unknown> = { token: 'abc', active: true };
    const session = new SessionData(originalData);
    const encoded: EncodedString = codec.encode(session);

    const decodedSession: SessionData = codec.decode(encoded);
    const result: Record<string, unknown> = decodedSession.retrieve();

    expect(result).toEqual(originalData);
  });

  it('deve retornar uma sessão vazia ao tentar decodificar uma string inválida', () => {
    const codec = new SessionCodec();
    const invalidEncodedString = new EncodedString('isso-nao-e-base64-valido!!!');

    const decodedSession: SessionData = codec.decode(invalidEncodedString);
    const result: Record<string, unknown> = decodedSession.retrieve();

    expect(result).toEqual({});
  });

  it('deve suportar codificação e decodificação de caracteres especiais (UTF-8)', () => {
    const codec = new SessionCodec();
    const dataWithSpecialChars: Record<string, unknown> = { message: 'Olá, mundo! ⚡' };
    const session = new SessionData(dataWithSpecialChars);

    const encoded: EncodedString = codec.encode(session);
    const decodedSession: SessionData = codec.decode(encoded);
    const result: Record<string, unknown> = decodedSession.retrieve();

    expect(result).toEqual(dataWithSpecialChars);
  });
});