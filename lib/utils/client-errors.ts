export function getUserFacingErrorMessage(
  error: unknown,
  fallbackMessage: string,
) {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const message = error.message.toLowerCase();

  if (
    message.includes("failed to fetch") ||
    message.includes("network error") ||
    message.includes("load failed")
  ) {
    return "Unable to reach the server right now. Please check your connection and try again.";
  }

  if (message.includes("unauthorized")) {
    return "Your session has expired. Please log in again.";
  }

  if (message.includes("database connection is temporarily unavailable")) {
    return "The database is temporarily unavailable. Please try again in a moment.";
  }

  if (message.includes("server returned a non-json response")) {
    return "Something unexpected happened on the server. Please try again.";
  }

  if (message.includes("gemini_api_key is not configured")) {
    return "AI setup is incomplete. Add your Gemini API key and try again.";
  }

  return error.message || fallbackMessage;
}
