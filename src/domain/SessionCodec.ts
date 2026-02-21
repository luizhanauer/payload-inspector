export class SessionData {
  private readonly data: Record<string, unknown>;

  constructor(data: Record<string, unknown>) {
    this.data = data;
  }

  public retrieve(): Record<string, unknown> {
    return this.data;
  }
}

export class EncodedString {
  private readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

  public retrieve(): string {
    return this.value;
  }
}

export class SessionCodec {
  public encode(session: SessionData): EncodedString {
    const jsonString: string = JSON.stringify(session.retrieve());
    const safeString: string = encodeURIComponent(jsonString);
    const base64: string = btoa(safeString);
    
    return new EncodedString(base64);
  }

  public decode(encoded: EncodedString): SessionData {
    try {
      const decodedBase64: string = atob(encoded.retrieve());
      const decodedString: string = decodeURIComponent(decodedBase64);
      const parsedData: unknown = JSON.parse(decodedString);
      
      if (this.isValidSessionData(parsedData)) {
        return new SessionData(parsedData);
      }
      
      return this.fallbackEmptySession();
    } catch (error: unknown) {
      return this.fallbackEmptySession();
    }
  }

  /**
   * Type Guard para garantir que o 'any/unknown' retornado pelo JSON.parse
   * é de fato um objeto literal compatível com Record<string, unknown>.
   */
  private isValidSessionData(data: unknown): data is Record<string, unknown> {
    return (
      typeof data === 'object' && 
      data !== null && 
      !Array.isArray(data)
    );
  }

  private fallbackEmptySession(): SessionData {
    return new SessionData({});
  }
}