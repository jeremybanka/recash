import type { FormEvent, FormEventHandler } from "react"
import { useRef, useEffect } from "react"

import { useRecoilState } from "recoil"

import type { Setter, ID } from ".."
import type { Cache } from "../cache"
import type { Getter } from "../getter"
import { createGetter } from "../getter"
import type { Delta } from "../util/diff"
import { useDelta } from "./delta"
import type { Pull, PullPolicy } from "./pull"
import type { Push } from "./push"
import { useReset } from "./reset"

export const AUTO_SAVE = Symbol(`auto save`)

export type TimeUnit = `d` | `h` | `m` | `ms` | `s`

export type TimeAmount = `${number}${TimeUnit}`
const TIME_FACTORS: Record<TimeUnit, number> = {
  d: 86400000,
  h: 3600000,
  m: 60000,
  ms: 1,
  s: 1000,
}

export const parseTimeAmount = (time: TimeAmount): number => {
  const unit = time.slice(-2) === `ms` ? `ms` : (time.slice(-1) as TimeUnit)
  const amount = unit === `ms` ? time.slice(0, -2) : time.slice(0, -1)
  const factor = TIME_FACTORS[unit]
  return Number(amount) * factor
}

export type SyncOptions = {
  id?: ID
  every?: TimeAmount
  autoSave?: typeof AUTO_SAVE
}

export type Refresh<T> = (policy?: PullPolicy) => Promise<T>

export type SyncTools<T, PUSH, PULL> = {
  inbound: Delta<T>
  outbound: Delta<T>
  cancel: VoidFunction
  refresh: PULL extends Pull<T> ? Refresh<T> : undefined
  submit: PUSH extends Push<T> ? FormEventHandler : undefined
}

export const useSync = <
  T,
  SYNC_CONFIG extends {
    push?: Push<T> | undefined
    pull?: Pull<T> | undefined
    cache: Cache<T>
  },
>({
  id = ``,
  cache,
  push,
  pull,
  every,
  autoSave,
}: SYNC_CONFIG & SyncOptions): SYNC_CONFIG[`push`] extends Push<T>
  ? [
      Getter<T>,
      Setter<T>,
      SyncTools<T, SYNC_CONFIG[`push`], SYNC_CONFIG[`pull`]>,
    ]
  : Getter<T> => {
  if (!push && !pull) {
    console.warn(`No push or pull provided for "${id}" in "${cache.key}"`)
  }

  const lastPulled = useRef(Date.now())
  const shouldPull = () => lastPulled.current + 1337 < Date.now()

  if (pull && shouldPull()) {
    lastPulled.current = Date.now()
    pull(id, `overwrite-clean-fields`)
  } // prevent the pull from being called too often

  const [state, set] = useRecoilState(cache.findState(id))
  const { outbound, inbound } = useDelta({ cache, id })

  useEffect(() => {
    if (every && state) {
      const timing = parseTimeAmount(every)
      const interval = setInterval(() => {
        if (push && outbound && autoSave) {
          push(state, outbound)
        } else if (pull && shouldPull()) {
          pull(id, `overwrite-clean-fields`)
        }
      }, timing)
      return () => clearInterval(interval)
    }
    return undefined
  }, [every, push])

  const getState: Getter<T> =
    pull && state === undefined
      ? createGetter(() => pull(id, `overwrite-all`))
      : () => state as T

  const setState = state
    ? set
    : () =>
        console.warn(
          `Edit failed: "${id}" in "${cache.key + `Local`}" was not found.`,
        )

  const reset = useReset(cache)

  // @ts-expect-error not recognizing that we are pivoting on typeof push
  return push
    ? [
        getState,
        setState,
        {
          submit: state
            ? (e: FormEvent) => {
                e.preventDefault()
                push(state, outbound)
              }
            : undefined,
          refresh: pull
            ? (policy?: PullPolicy) =>
                pull(id, policy ?? `overwrite-clean-fields`)
            : undefined,
          cancel: () => reset(id),
          inbound,
          outbound,
        },
      ]
    : getState
}

export type Sync<
  T,
  PUSH extends Push<T> | undefined,
  PULL extends Pull<T> | undefined,
> = (
  id?: string,
  every?: TimeAmount,
  autoSave?: typeof AUTO_SAVE,
) => [Getter<T>, Setter<T>, SyncTools<T, PUSH, PULL>]
