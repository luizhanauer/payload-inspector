// src/domain/JsonAutoFormatter.spec.ts
import { describe, it, expect } from 'vitest';
import { JsonAutoFormatter } from './JsonAutoFormatter';

describe('JsonAutoFormatter', () => {
  it('deve manter valores não-string inalterados (numeros, booleanos, objetos reais)', () => {
    const formatter = new JsonAutoFormatter();
    const payload: Record<string, unknown> = {
      numero: 42,
      ativo: true,
      nulo: null,
      objetoJaFormatado: { a: 1 }
    };

    const result: Record<string, unknown> = formatter.format(payload);

    expect(result).toEqual({
      numero: 42,
      ativo: true,
      nulo: null,
      objetoJaFormatado: { a: 1 }
    });
  });

  it('deve manter strings comuns (que nao parecem JSON) inalteradas', () => {
    const formatter = new JsonAutoFormatter();
    const payload: Record<string, unknown> = {
      texto: 'apenas um texto normal',
      token: 'Bearer xyz123'
    };

    const result: Record<string, unknown> = formatter.format(payload);

    expect(result).toEqual({
      texto: 'apenas um texto normal',
      token: 'Bearer xyz123'
    });
  });

  it('deve detectar e converter strings que contêm objetos JSON validos', () => {
    const formatter = new JsonAutoFormatter();
    const payload: Record<string, unknown> = {
      usuario: '{"id": 1, "nome": "Dev"}'
    };

    const result: Record<string, unknown> = formatter.format(payload);

    expect(result).toEqual({
      usuario: { id: 1, nome: 'Dev' }
    });
  });

  it('deve detectar e converter strings que contêm arrays JSON validos', () => {
    const formatter = new JsonAutoFormatter();
    const payload: Record<string, unknown> = {
      lista: '["maca", "banana", "laranja"]'
    };

    const result: Record<string, unknown> = formatter.format(payload);

    expect(result).toEqual({
      lista: ['maca', 'banana', 'laranja']
    });
  });

  it('deve ignorar espaços em branco extras nas bordas da string antes de fazer o parse', () => {
    const formatter = new JsonAutoFormatter();
    const payload: Record<string, unknown> = {
      sujo: '   \n  {"chave": "valor limpo"} \t  '
    };

    const result: Record<string, unknown> = formatter.format(payload);

    expect(result).toEqual({
      sujo: { chave: 'valor limpo' }
    });
  });

  it('deve retornar a string original intacta se parecer um JSON mas falhar no JSON.parse (malformado)', () => {
    const formatter = new JsonAutoFormatter();
    // JSON invalido propositalmente (falta aspas na chave)
    const payload: Record<string, unknown> = {
      quebrado: '{ chaveSemAspas: 123 }'
    };

    const result: Record<string, unknown> = formatter.format(payload);

    expect(result).toEqual({
      quebrado: '{ chaveSemAspas: 123 }'
    });
  });
});