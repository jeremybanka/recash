const treeShake = <T>(obj?: T, discardValue: any = undefined): Partial<T> => {
  if (!obj) return {}
  const newObj = {} as Partial<T>
  const entries = Object.entries(obj) as [keyof T, any][]
  entries.forEach(([key, val]) => {
    if (val !== discardValue && val !== null) {
      newObj[key] = val
    }
  })
  return newObj
}

export default treeShake
