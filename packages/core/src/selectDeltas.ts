import { selectorFamily } from "recoil"

import type { ID, RecoilStateFamily, RecoilValueFamily } from "."
import type { Delta } from "./util/diff"
import { getDiff } from "./util/diff"

export type Deltas<T> = {
  outbound: Delta<T>
  inbound: Delta<T>
}

export const getDeltas = <T>(
  local: T | undefined,
  remote: T | undefined,
): Deltas<T> => {
  if (remote === undefined || local === undefined) {
    return {
      outbound: null,
      inbound: null,
    }
  }
  const diff = getDiff(local, remote)
  return {
    outbound: diff[0],
    inbound: diff[1],
  }
}

export const selectDeltas = <T>(
  findLocalState: RecoilStateFamily<T | undefined, ID>,
  findRemoteState: RecoilStateFamily<T | undefined, ID>,
  key: string,
): RecoilValueFamily<Deltas<T>, ID> =>
  selectorFamily<Deltas<T>, ID>({
    key: `${key}Deltas`,
    get:
      (param) =>
      ({ get }) => {
        const local = get(findLocalState(param))
        const remote = get(findRemoteState(param))
        return getDeltas(local, remote)
      },
  })
