/**
 * Learn LMS — Communication Moderation & Sanitization (Phase 6)
 * ORELSE (https://www.orelse.ai)
 */

export interface ModerationResult {
  isValid: boolean;
  cleanText: string;
  flagged: boolean;
  error?: string;
}

/**
 * Sanitizes and validates user-submitted messages and thread subjects
 */
export function sanitizeMessageContent(
  text: string,
  maxLength: number = 2000
): ModerationResult {
  if (!text || typeof text !== "string") {
    return {
      isValid: false,
      cleanText: "",
      flagged: false,
      error: "Message content cannot be empty.",
    };
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return {
      isValid: false,
      cleanText: "",
      flagged: false,
      error: "Message content cannot be blank.",
    };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      cleanText: trimmed.substring(0, maxLength),
      flagged: false,
      error: `Message exceeds maximum allowed length of ${maxLength} characters.`,
    };
  }

  // Remove unsafe HTML tags and potential script injections
  const clean = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, ""); // Strip any HTML tags

  return {
    isValid: true,
    cleanText: clean,
    flagged: false,
  };
}
