import { useRecoilValue } from "recoil"

import type { Cache } from ".."
import type { Deltas } from "../selectDeltas"

export type DiffOptions<T> = {
  cache: Cache<T>
  id: string
}

export const useDelta = <T>({ cache, id }: DiffOptions<T>): Deltas<T> =>
  useRecoilValue(cache.findDeltas(id))
