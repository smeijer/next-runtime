function join(url: string, ...path: string[]): string {
  return [url, path.join('/')].join(path[0]?.[0] === '/' ? '' : '/');
}

export function absoluteUrl(...path: string[]): string {
  return join(process.env.NEXT_PUBLIC_ROOT_URL as string, ...path);
}
