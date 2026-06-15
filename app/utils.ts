const encodeBase62 = (num: number): string => {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (num === 0) return alphabet[0]!;
  let encoded = "";
  while (num > 0) {
    encoded = alphabet[num % 62] + encoded;
    num = Math.floor(num / 62);
  }
  return encoded;
};

const decodeBase62 = (encodedString: string) => {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let decodedValue = 0;
  for (let i = 0; i < encodedString.length; i++) {
    decodedValue = decodedValue * 62 + alphabet.indexOf(encodedString[i]!);
  }
  return decodedValue;
};

export { encodeBase62, decodeBase62 };