export class FetchError extends Error {
  status: number;
  statusText: string;
  headers: Headers;
  data?: Record<string, unknown>;

  constructor(response: Response, data: Record<string, unknown>) {
    super(`[${response.status}]: ${response.statusText}`);
    this.status = response.status;
    this.statusText = response.statusText;
    this.headers = response.headers;
    this.data = data;
  }

  static async create(response: Response): Promise<FetchError> {
    const data = response.headers
      .get('content-type')
      ?.startsWith('application/json')
      ? await response.json()
      : undefined;

    return new FetchError(response, data);
  }
}
