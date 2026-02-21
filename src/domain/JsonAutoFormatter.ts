export class JsonAutoFormatter {
  public format(payload: Record<string, unknown>): Record<string, unknown> {
    const formattedPayload: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(payload)) {
      formattedPayload[key] = this.parseIfJsonString(value);
    }

    return formattedPayload;
  }

  private parseIfJsonString(value: unknown): unknown {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmedValue: string = value.trim();
    
    if (this.isNotJsonStructure(trimmedValue)) {
      return value;
    }

    return this.attemptParse(trimmedValue, value);
  }

  private isNotJsonStructure(text: string): boolean {
    const isObject: boolean = text.startsWith('{') && text.endsWith('}');
    const isArray: boolean = text.startsWith('[') && text.endsWith(']');
    
    return !isObject && !isArray;
  }

  private attemptParse(jsonString: string, originalValue: unknown): unknown {
    try {
      const parsed: unknown = JSON.parse(jsonString);
      return parsed;
    } catch (error: unknown) {
      return originalValue;
    }
  }
}