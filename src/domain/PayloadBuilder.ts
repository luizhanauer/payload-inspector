import { JsonAutoFormatter } from './JsonAutoFormatter';

export interface EditorEntry {
  readonly id: string;
  key: string;
  value: string;
}

export class PayloadBuilder {
  private readonly formatter: JsonAutoFormatter;

  constructor() {
    this.formatter = new JsonAutoFormatter();
  }

  public buildFromEntries(entries: EditorEntry[]): Record<string, unknown> {
    const rawRecord: Record<string, string> = {};

    for (const entry of entries) {
      if (this.isValidEntry(entry)) {
        rawRecord[entry.key] = entry.value;
      }
    }

    return this.formatter.format(rawRecord);
  }

  public convertRecordToEntries(record: Record<string, unknown>): EditorEntry[] {
    const entries: EditorEntry[] = [];

    for (const [key, value] of Object.entries(record)) {
      const stringValue: string = this.extractStringValue(value);
      const uniqueId: string = this.generateId();
      
      entries.push({
        id: uniqueId,
        key: key,
        value: stringValue
      });
    }

    return entries;
  }

  private isValidEntry(entry: EditorEntry): boolean {
    const hasKey: boolean = entry.key.trim().length > 0;
    return hasKey;
  }

  private extractStringValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    
    return this.attemptStringify(value);
  }

  private attemptStringify(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch (error: unknown) {
      return String(value);
    }
  }

  private generateId(): string {
    const randomHex: string = Math.random().toString(36).substring(2, 9);
    const timestamp: string = Date.now().toString(36);
    return `${timestamp}-${randomHex}`;
  }
}