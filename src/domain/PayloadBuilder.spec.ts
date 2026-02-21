import { describe, it, expect } from 'vitest';
import { PayloadBuilder } from './PayloadBuilder';
import type { EditorEntry } from './PayloadBuilder';

describe('PayloadBuilder', () => {
  it('deve converter um dicionario simples para entradas de edicao', () => {
    const builder = new PayloadBuilder();
    const record: Record<string, unknown> = { name: 'Inspector', version: 1 };

    const entries: EditorEntry[] = builder.convertRecordToEntries(record);

    expect(entries).toHaveLength(2);
    
    // Evita o acesso por índice (entries[0]) usando matchers nativos do Vitest
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'name', value: 'Inspector' }),
        expect.objectContaining({ key: 'version', value: '1' })
      ])
    );
  });

  it('deve ignorar entradas com chaves vazias ao construir o payload', () => {
    const builder = new PayloadBuilder();
    const entries: EditorEntry[] = [
      { id: '1', key: 'validKey', value: 'data' },
      { id: '2', key: '   ', value: 'ignored' },
      { id: '3', key: '', value: 'also_ignored' }
    ];

    const result: Record<string, unknown> = builder.buildFromEntries(entries);

    expect(Object.keys(result)).toHaveLength(1);
    // toHaveProperty evita TS2532 ao tentar acessar dicionários diretamente
    expect(result).toHaveProperty('validKey', 'data'); 
  });

  it('deve auto-formatar valores em string que representam objetos JSON validos', () => {
    const builder = new PayloadBuilder();
    const entries: EditorEntry[] = [
      { id: '1', key: 'user', value: '{"id": 42, "role": "admin"}' }
    ];

    const result: Record<string, unknown> = builder.buildFromEntries(entries);

    // Avaliação aninhada e segura sem type casting as Record<string, unknown>
    expect(result).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          id: 42,
          role: 'admin'
        })
      })
    );
  });
});