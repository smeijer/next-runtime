export type HttpMethodWithBody = typeof httpMethodsWithBody[number];
export const httpMethodsWithBody = ['post', 'put', 'delete', 'patch'] as const;

export type HttpMethod = typeof httpMethods[number];
export const httpMethods = [...httpMethodsWithBody, 'get'] as const;
