export type Unchanged = <T>(a: T, b: T) => Partial<T>

export const unchanged: Unchanged = (a, b) => {
  const result: typeof a = { ...a }

  if (a === b) {
    return result
  }

  if (JSON.stringify(a) === JSON.stringify(b)) {
    return result
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const key in a) {
    if (Object.prototype.hasOwnProperty.call(a, key)) {
      if (typeof a[key] === `object`) {
        // console.log(key, JSON.stringify(a[key]), JSON.stringify(b[key]));
        if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
          delete result[key]
        }
      } else if (a[key] !== b[key]) {
        delete result[key]
      }
    }
  }

  return result
}
