import { Observable } from 'rxjs';

/** Placeholder return for decorated methods. The decorator replaces the implementation. */
export function request<T = never>(): Observable<T> {
  return undefined as unknown as Observable<T>;
}
