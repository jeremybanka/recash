import { useRecoilTransaction_UNSTABLE } from "recoil"

import type { Cache } from ".."

export type Reset<T> = { cache: Cache<T>; id: string }

export const useReset = <T>(cache: Cache<T>): ((id: string) => void) =>
  useRecoilTransaction_UNSTABLE(({ get, set }) => (id: string) => {
    const remoteState = cache.findRemoteState(id)
    const localState = cache.findState(id)
    set(localState, get(remoteState))
  })
