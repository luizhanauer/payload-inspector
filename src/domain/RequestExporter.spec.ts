import { describe, it, expect } from 'vitest';
import { RequestExporter } from './RequestExporter';
import type { OutputAction } from './RequestExporter';

describe('RequestExporter', () => {
  it('deve gerar uma URL final com query strings quando o metodo for GET', () => {
    const exporter = new RequestExporter();
    const payload: Record<string, unknown> = { id: 10, search: 'test' };
    
    const url: string = exporter.generateFinalUrl('GET', 'https://api.com', payload);

    expect(url).toBe('https://api.com?id=10&search=test');
  });

  it('nao deve anexar query strings na URL quando o metodo for POST', () => {
    const exporter = new RequestExporter();
    const payload: Record<string, unknown> = { id: 10 };
    
    const url: string = exporter.generateFinalUrl('POST', 'https://api.com', payload);

    expect(url).toBe('https://api.com');
  });

  it('deve gerar um snippet cURL para GET', () => {
    const exporter = new RequestExporter();
    const payload: Record<string, unknown> = { status: 'active' };
    
    const curl: string = exporter.generateCurl('GET', 'https://api.com', payload, 'none');

    expect(curl).toContain('-X GET');
    expect(curl).toContain('https://api.com?status=active');
  });

  it('deve anexar corretamente o pipe de clipboard do linux', () => {
    const exporter = new RequestExporter();
    const payload: Record<string, unknown> = {};
    const action: OutputAction = 'linux';
    
    const curl: string = exporter.generateCurl('GET', 'https://api.com', payload, action);

    expect(curl).toContain('| xclip -selection clipboard');
  });

  it('deve formatar o body JSON corretamente e escapar aspas simples no POST', () => {
    const exporter = new RequestExporter();
    const payload: Record<string, unknown> = { message: "it's a test" };
    
    const curl: string = exporter.generateCurl('POST', 'https://api.com', payload, 'none');

    expect(curl).toContain('-X POST');
    expect(curl).toContain('Content-Type: application/json');
    // Verifica o escape de aspas simples para o shell
    expect(curl).toContain("'{\"message\":\"it'\\''s a test\"}'"); 
  });
});