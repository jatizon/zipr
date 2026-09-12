const BASE62_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const encodeBase62 = (num: number): string => {
  if (num === 0) return BASE62_ALPHABET[0]!;
  let encoded = "";
  while (num > 0) {
    encoded = BASE62_ALPHABET[num % 62] + encoded;
    num = Math.floor(num / 62);
  }
  return encoded;
};

const decodeBase62 = (encodedString: string) => {
  let decodedValue = 0;
  for (let i = 0; i < encodedString.length; i++) {
    decodedValue = decodedValue * 62 + BASE62_ALPHABET.indexOf(encodedString[i]!);
  }
  return decodedValue;
};

export { encodeBase62, decodeBase62, BASE62_ALPHABET };