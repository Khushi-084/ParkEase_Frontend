export function extractApiError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Something went wrong.';
  }

  const candidate = error as {
    error?: {
      error?: string;
      title?: string;
      errors?: Record<string, string[]>;
    };
    message?: string;
  };

  if (candidate.error?.error) {
    return candidate.error.error;
  }

  const modelStateErrors = candidate.error?.errors;
  if (modelStateErrors) {
    const messages = Object.values(modelStateErrors).flat().filter(Boolean);
    if (messages.length > 0) {
      return messages.join(' ');
    }
  }

  if (candidate.error?.title) {
    return candidate.error.title;
  }

  if (candidate.message) {
    return candidate.message;
  }

  return 'Something went wrong.';
}
