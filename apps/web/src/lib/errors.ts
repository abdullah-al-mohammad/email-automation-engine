import { isAxiosError } from 'axios';

export function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }
  return 'An unexpected error occurred.';
}
