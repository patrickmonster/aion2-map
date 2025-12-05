// Base32 인코딩/디코딩 유틸리티

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function encodeBase32(str: string): string {
  if (!str) return "";

  // UTF-8 문자열을 바이트 배열로 변환
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);

  let result = "";
  let buffer = 0;
  let bitsLeft = 0;

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;

    while (bitsLeft >= 5) {
      const index = (buffer >> (bitsLeft - 5)) & 0x1f;
      result += BASE32_ALPHABET[index];
      bitsLeft -= 5;
    }
  }

  if (bitsLeft > 0) {
    const index = (buffer << (5 - bitsLeft)) & 0x1f;
    result += BASE32_ALPHABET[index];
  }

  return result.toLowerCase();
}

export function decodeBase32(str: string): string {
  if (!str) return "";

  const input = str.toUpperCase();
  let buffer = 0;
  let bitsLeft = 0;
  const bytes: number[] = [];

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;

    buffer = (buffer << 5) | index;
    bitsLeft += 5;

    if (bitsLeft >= 8) {
      bytes.push((buffer >> (bitsLeft - 8)) & 0xff);
      bitsLeft -= 8;
    }
  }

  // 바이트 배열을 UTF-8 문자열로 변환
  const decoder = new TextDecoder();
  return decoder.decode(new Uint8Array(bytes));
}
