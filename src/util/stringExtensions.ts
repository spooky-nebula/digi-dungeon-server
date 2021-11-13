/**
 * Returns a string without any html tags
 * @param {string} str
 * @return {string}
 */
function sanitize(str: string) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Cuts up a string into an array on new line chars
 * @param {string} str
 * @return {string[]}
 */
function diceUp(str: string): string[] {
  return str.split('\n');
}

/**
 * Returns the value after the ":" symbol of a string
 * @param {string} str
 * @return {string}
 */
function getValue(str: string): string {
  return str.substring(str.indexOf(':') + 1);
}

function bufferize(body: Object) {
  let key: keyof typeof body;
  let array_like: number[] = [];
  for (key in body) {
    if (typeof body[key] == 'number') {
      let int: number = body[key] as unknown as number;
      array_like.push(int);
    }
  }
  let buffer = Uint8Array.from(array_like);
  return buffer;
}

export { sanitize, diceUp, getValue, bufferize };
