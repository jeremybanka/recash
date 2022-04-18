import type { Cache, ID } from ".."
import { USE_LOAD } from "../cache"
import type { LoadPolicy } from "../loader"
import type { ReadQuery } from "../query"

export type PullPolicy = Exclude<LoadPolicy, `local-only`>

export type PullOptions<T, QUERY_OUTPUT> = {
  cache: Cache<T>
  query: ReadQuery<QUERY_OUTPUT>
  policy?: PullPolicy
  deserialize?: (output: QUERY_OUTPUT) => T[]
}
export type Pull<T> = (id?: ID, policy?: PullPolicy) => Promise<T>

export const usePull = <T, QUERY_OUTPUT>({
  cache,
  query,
  policy: defaultPolicy,
  deserialize = (queryOutput) => [queryOutput] as unknown as T[],
}: PullOptions<T, QUERY_OUTPUT>): Pull<T> => {
  const load = cache[USE_LOAD]()
  return async (id, policy) => {
    const output = await query(id ?? (`` as ID))
    const newValues = deserialize(output)
    load(newValues, policy ?? defaultPolicy)
    return newValues[0]
  }
}
