export function stripMarkdown(text: string): string {
  if (!text) return "";

  let cleaned = text;

  // Remove code blocks (```code```)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");

  // Remove inline code (`code`)
  cleaned = cleaned.replace(/`[^`]*`/g, "");

  // Remove images (![alt](url))
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]*\)/g, "");

  // Remove links but keep the text ([text](url) -> text)
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove headers (# ## ###)
  cleaned = cleaned.replace(/^#{1,6}\s+(.+)$/gm, "$1");

  // Remove bold (**text** or __text__)
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1");
  cleaned = cleaned.replace(/__([^_]+)__/g, "$1");

  // Remove italic (*text* or _text_)
  cleaned = cleaned.replace(/\*([^*]+)\*/g, "$1");
  cleaned = cleaned.replace(/_([^_]+)_/g, "$1");

  // Remove strikethrough (~~text~~)
  cleaned = cleaned.replace(/~~([^~]+)~~/g, "$1");

  // Remove blockquotes (> text)
  cleaned = cleaned.replace(/^>\s+(.+)$/gm, "$1");

  // Remove horizontal rules (---, ***, ___)
  cleaned = cleaned.replace(/^[-*_]{3,}$/gm, "");

  // Remove list markers (-, *, +, 1., 2., etc.)
  cleaned = cleaned.replace(/^[\s]*[-*+]\s+(.+)$/gm, "$1");
  cleaned = cleaned.replace(/^[\s]*\d+\.\s+(.+)$/gm, "$1");

  // Remove table syntax (| col |)
  cleaned = cleaned.replace(/\|/g, "");

  // Clean up multiple spaces and newlines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.replace(/[ \t]+/g, " ");

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

