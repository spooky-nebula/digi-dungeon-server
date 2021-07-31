import crypto from 'crypto';

/**
 * Generates a random string of characters
 * @param length
 * @return {string}
 */
function generateString(length: number): string {
  let characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return generateSet(length, characters);
}

/**
 * Generates a random string of the desired length
 * @param length
 * @return {string}
 */
function generateNumber(length: number): string {
  let characters = '0123456789';
  return generateSet(length, characters);
}

/**
 * Generates a random string of characters from a set
 * @param {number} length
 * @param {string} set - string defining what the output string will be composed of
 * @return {string}
 */
function generateSet(length: number, set: string): string {
  let result = '';
  let setLength = set.length;

  //for (let i = 0; i < length; i++) {
  //  result += set.charAt(Math.floor(Math.random() * setLength));
  //}

  // True random better than pseudo random????
  let bytes = crypto.randomBytes(length);

  for (let i = 0; i < bytes.length; ++i) {
    result += set[bytes.readUInt8(i) % setLength];
  }

  return result;
}

// https://jsfiddle.net/1nm8ojxy/
/**
 * Returns a random number between min and max
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
function getRandomArbitrary(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Returns a random hex colour
 * @return {string}
 */
function randomColour(): string {
  //return "#" + Math.random().toString(16).slice(2, 8);
  return '#' + getRandomArbitrary(0.6, 0.9).toString(16).slice(2, 8);
}

export {
  generateString,
  generateNumber,
  generateSet,
  getRandomArbitrary,
  randomColour
};
