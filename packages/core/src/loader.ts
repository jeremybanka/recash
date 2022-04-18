import { useRecoilTransaction_UNSTABLE } from "recoil"

import type { ID, IdAccessor, RecoilStateFamily } from "."
import { cookieCut } from "./util/cookieCut"
import { getDiff } from "./util/diff"
import { unchanged } from "./util/unchanged"

export const DESTROYED = Symbol(`DESTROYED`)

export type Destroyed<T> = { [DESTROYED]: T }

export const isDestroyed = <T>(item: unknown): item is Destroyed<T> =>
  typeof item === `object` && item !== null && DESTROYED in item

export const exists = <T>(item: Destroyed<string> | T | undefined): item is T =>
  item !== undefined && !isDestroyed(item)

export type LoadPolicy =
  | `local-only`
  | `overwrite-all`
  | `overwrite-clean-fields`
  | `overwrite-clean-items`
  | `remote-only`

export type LoadOperation<T> = (id: ID, state: T | undefined) => void

export type LoaderOptions<T> = {
  getId: IdAccessor<T>
  local: RecoilStateFamily<T | undefined, ID>
  remote: RecoilStateFamily<T | undefined, ID>
}

export type Loader<T> = (
  data: Destroyed<string>[] | Promise<T[]> | T[],
  policy?: LoadPolicy,
) => void

export const buildLoader =
  <T>({ getId, local, remote }: LoaderOptions<T>): (() => Loader<T>) =>
  () =>
    useRecoilTransaction_UNSTABLE(({ set, get }) => {
      // const setIndex =
      //   (globalIndex: Set<P>, id: P, newValue: T | undefined) => {
      //   if (newValue) {
      //     globalIndex.add(id)
      //   } else {
      //     globalIndex.delete(id)
      //   }
      //   set(globalIndexState, globalIndex)
      // }
      const operations: Record<LoadPolicy, LoadOperation<T>> = {
        "local-only": (id, newValue) => {
          set(local(id), newValue)
        },
        "remote-only": (id, newValue) => {
          set(remote(id), newValue)
        },
        "overwrite-all": (id, newValue) => {
          set(remote(id), newValue)
          set(local(id), newValue)
        },
        "overwrite-clean-items": (id, newValue) => {
          const localVal = get(local(id))
          const remoteVal = get(remote(id))
          if (getDiff(localVal, remoteVal)[0] === null) {
            set(local(id), newValue)
          }
          set(remote(id), newValue)
        },
        "overwrite-clean-fields": (id, newValue) => {
          const localVal = get(local(id))
          const remoteVal = get(remote(id))

          if (getDiff(localVal, remoteVal)[0] === null) set(local(id), newValue)
          if (!isDestroyed(newValue) && exists(localVal) && exists(remoteVal)) {
            const cleanFields = unchanged(remoteVal, localVal)
            const cleanFieldsNew = cookieCut(newValue, cleanFields)
            const cleanFieldsDelta = getDiff(cleanFieldsNew, cleanFields)[0]
            const newLocal = { ...localVal, ...cleanFieldsDelta }
            set(local(id), newLocal)
          }
          set(remote(id), newValue)
        },
      }
      return async (data, policy = `overwrite-clean-items`) => {
        if (data instanceof Promise) {
          data = await data
        }
        const load = operations[policy]
        data.forEach((value) =>
          load(
            isDestroyed(value) ? value[DESTROYED] : getId(value),
            isDestroyed(value) ? undefined : value,
          ),
        )
      }
    })
