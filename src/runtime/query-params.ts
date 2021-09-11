import { ParsedUrlQuery } from '../types/querystring';
import { setField } from './set-field';

export function expandQueryParams(query: ParsedUrlQuery) {
  const result = {};

  for (const [field, value] of Object.entries(query)) {
    setField(result, field, value);
  }

  return result;
}
