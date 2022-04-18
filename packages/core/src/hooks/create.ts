import type { OutputToState, StateToInput } from "."
import type { Cache, ID } from ".."
import { USE_LOAD } from "../cache"

export type CreateOptions<T, QI = T, QO = T> = {
  cache: Cache<T>
  query: (input: QI) => Promise<QO>
  toInput?: StateToInput<T, QI>
  toState?: OutputToState<T, QO>
}

export type Create<T> = (state?: T) => Promise<T>

export const useCreate = <T, QI = T, QO = T>({
  query,
  cache,
  toInput = (state) => state as unknown as QI,
  toState = (queryOutput) => queryOutput as unknown as T,
}: CreateOptions<T, QI, QO>): Create<T> => {
  const load = cache[USE_LOAD]()
  return async (state?: T) => {
    const input = toInput(state)
    const output = await query(input)
    const newValue = toState(output)
    load([newValue], `overwrite-all`)
    return newValue
  }
}
