declare module 'uuid' {
  export function v1(options?: unknown, buffer?: unknown, offset?: number): string;
  export function v3(name: string | Uint8Array, namespace: string | Uint8Array, buffer?: unknown, offset?: number): string;
  export function v4(options?: unknown, buffer?: unknown, offset?: number): string;
  export function v5(name: string | Uint8Array, namespace: string | Uint8Array, buffer?: unknown, offset?: number): string;
  export function v7(options?: unknown, buffer?: unknown, offset?: number): string;
  export function validate(uuid: string): boolean;
  export function version(uuid: string): number;
  export const NIL: string;
}
