export function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (message.length > 0) return message;
  }
  return fallbackMessage;
}
