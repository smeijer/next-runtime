const [major, minor, patch] = process.version
  .slice(1)
  .split('.')
  .map((x) => parseInt(x));

// node v16.3 causes an Segmentation fault, should be fixed in 16.4
// https://github.com/nodejs/node/issues/39019
export const USE_ASYNC_LOCAL_STORAGE = major >= 16 && minor >= 4;

export function assertEnabled(flag, message): asserts flag is true {
  if (!flag) {
    throw new Error(message);
  }
}
