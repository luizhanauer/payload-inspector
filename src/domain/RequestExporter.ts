export type OutputAction = 'linux' | 'mac' | 'windows' | 'file' | 'none';

export class RequestExporter {
  public generateFinalUrl(method: string, baseUrl: string, payload: Record<string, unknown>): string {
    const safeUrl: string = baseUrl.trim() || 'https://api.exemplo.com/endpoint';

    if (method === 'GET') {
      return this.appendQueryToUrl(safeUrl, payload);
    }

    return safeUrl;
  }

  public generateCurl(method: string, baseUrl: string, payload: Record<string, unknown>, outputAction: OutputAction = 'none'): string {
    const finalUrl: string = this.generateFinalUrl(method, baseUrl, payload);
    const baseCurl: string = this.buildBaseCurl(method, finalUrl, payload);
    
    return this.appendOutputAction(baseCurl, outputAction);
  }

  private buildBaseCurl(method: string, url: string, payload: Record<string, unknown>): string {
    if (method === 'GET') {
      return `curl -s -X GET "${url}"`;
    }

    const jsonBody: string = JSON.stringify(payload);
    const safeBody: string = jsonBody.replace(/'/g, "'\\''");
    
    return `curl -s -X ${method} "${url}" \\\n  -H "Content-Type: application/json" \\\n  -d '${safeBody}'`;
  }

  private appendQueryToUrl(baseUrl: string, payload: Record<string, unknown>): string {
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(payload)) {
      const stringValue: string = typeof value === 'string' ? value : JSON.stringify(value);
      params.append(key, stringValue);
    }
    
    const queryString: string = params.toString();
    
    if (queryString.length === 0) {
        return baseUrl;
    }

    return `${baseUrl}?${queryString}`;
  }

  private appendOutputAction(curlCommand: string, action: OutputAction): string {
    const actions: Record<OutputAction, string> = {
      'linux': ' | xclip -selection clipboard',
      'mac': ' | pbcopy',
      'windows': ' | clip',
      'file': ' > response.txt',
      'none': ''
    };

    return `${curlCommand}${actions[action]}`;
  }
}