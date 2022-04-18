export type Delta<T> = Partial<T> | null

export type Diff<T> = [Delta<T>, Delta<T>]

export type GetDiff = <T>(a: T, b: T) => Diff<T>

export const getDiff: GetDiff = (a, b) => {
  const deltaA: Partial<typeof a> = {}
  const deltaB: Partial<typeof a> = {}

  if (a === b) {
    return [null, null]
  }

  if (JSON.stringify(a) === JSON.stringify(b)) {
    return [null, null]
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const key in a) {
    if (Object.prototype.hasOwnProperty.call(a, key)) {
      if (typeof a[key] === `object`) {
        // console.log(key, JSON.stringify(a[key]), JSON.stringify(b[key]));
        if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
          deltaA[key] = a[key]
          deltaB[key] = b[key]
        }
      } else if (a[key] !== b[key]) {
        deltaA[key] = a[key]
        deltaB[key] = b[key]
      }
    }
  }

  if (Object.keys(deltaA).length === 0) {
    return [null, null]
  }

  return [deltaA, deltaB]
}
