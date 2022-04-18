import type { Voidable } from "."
import type { Cache, ID } from ".."
import { USE_LOAD } from "../cache"
import type { Delta } from "../util/diff"

export type PushOptions<T, QUERY_IN = T, QUERY_OUT = T> = {
  cache: Cache<T>
  query: (input: QUERY_IN) => Promise<QUERY_OUT>
  serialize?: (state: T, input: Partial<T>) => QUERY_IN
  deserialize?: (output: QUERY_OUT) => T[]
}
export type Push<T> = (state: T, outbound: Delta<T>) => Promise<Voidable<T>>

export const usePush = <T, QI = T, QO = T>({
  cache,
  query,
  serialize = (state) => state as unknown as QI,
  deserialize = (queryOutput) => [queryOutput] as unknown as T[],
}: PushOptions<T, QI, QO>): Push<T> => {
  const load = cache[USE_LOAD]()
  return async (state: T, outbound: Delta<T>) => {
    let newValues
    if (outbound) {
      const input = serialize(state, outbound)
      const output = await query(input)
      newValues = deserialize(output)
      load(newValues, `overwrite-all`)
    } else {
      console.warn(
        `Update Failed to item in cache "${cache.key}": no state present.`,
      )
    }
    return newValues?.[0]
  }
}
