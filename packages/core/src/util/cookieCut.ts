export const cookieCut = <T, PT extends Partial<T>>(
  completeRecord: T,
  cookieCutter: PT,
): PT => {
  const reducedRecord = { ...completeRecord } as unknown as PT
  // eslint-disable-next-line no-restricted-syntax
  for (const key in completeRecord) {
    if (Object.prototype.hasOwnProperty.call(completeRecord, key)) {
      if (!(key in cookieCutter)) {
        delete reducedRecord[key]
      }
    }
  }

  return reducedRecord
}
