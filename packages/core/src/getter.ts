export type Getter<T> = () => T

export const createGetter = <T>(get: () => Promise<T>): Getter<T> => {
  let status: `done` | `error` | `pending` = `pending`

  let data: T | undefined

  let error: Error

  const pending = get()
    .then((res: T) => {
      data = res
      status = `done`
    })
    .catch((e) => {
      error = e
      status = `error`
    })

  return () => {
    if (data) return data
    if (status === `error`) throw error
    else throw pending
  }
}
