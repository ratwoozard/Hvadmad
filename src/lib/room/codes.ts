const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase();
}

export function isValidCode(code: string): boolean {
  if (code.length !== CODE_LENGTH) return false;
  return code.split("").every((char) => CHARS.includes(char));
}
