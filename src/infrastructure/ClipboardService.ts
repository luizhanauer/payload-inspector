export class ClipboardService {
  public async copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error: unknown) {
      return this.fallbackError('Falha ao escrever na área de transferência.');
    }
  }

  public async paste(): Promise<string> {
    try {
      const text: string = await navigator.clipboard.readText();
      return text;
    } catch (error: unknown) {
      this.fallbackError('Permissão negada ou falha ao ler a área de transferência.');
      return '';
    }
  }

  private fallbackError(message: string): boolean {
    console.error(message);
    return false;
  }
}