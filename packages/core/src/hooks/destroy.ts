import type { Cache, ID } from ".."
import { USE_LOAD } from "../cache"
import { DESTROYED } from "../loader"

export type DestroyOptions<T> = {
  cache: Cache<T>
  query: (input: ID) => any
}
export type Destroy<P> = (id: P) => void

export const useDestroy = <T>({
  query,
  cache,
}: DestroyOptions<T>): Destroy<ID> => {
  const load = cache[USE_LOAD]()
  const destroy = async (id: string) => {
    const success = Boolean(await query(id))
    if (success) {
      load([{ [DESTROYED]: id }], `overwrite-all`)
    } else {
      console.warn(`Destroy Failed: "${cache.key + `Local__` + id}"`)
    }
  }
  return destroy
}
