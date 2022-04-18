import { useEffect, useRef } from "react"

import type { RecoilState } from "recoil"
import { useRecoilState, useRecoilValue } from "recoil"

import type { Cache, ComplexParam } from ".."
import { USE_INDEX, USE_LOAD } from "../cache"
import type { Getter } from "../getter"
import type { ListQuery } from "../query"
import treeShake from "../util/shallowTreeShake"
import type { PullPolicy } from "./pull"
import type { TimeAmount } from "./sync"
import { parseTimeAmount } from "./sync"

export type SortsAndFilters = ComplexParam

export type PageMeta = {
  page: number
  show: number
  total: number
  firstIdx: number
  lastIdx: number
}

export type Page<T> = {
  data: T[]
  meta: PageMeta
}

export type PullPage<T> = (policy?: PullPolicy) => Promise<T[]>

export type Cursor = {
  show?: number
  first?: string
  last?: string
}

export type ListOptions<T, OUTPUT> = {
  cache: Cache<T>
  query: ListQuery<OUTPUT>
  toList?: (fromQuery: OUTPUT) => T[]
  toMeta?: (fromQuery: OUTPUT) => PageMeta
  pullPolicy?: PullPolicy
  queryDefaults?: Cursor
  sortsAndFilters?: SortsAndFilters
  every?: TimeAmount
}

export type ListTools = Omit<PageMeta, `show`> & {
  refresh: VoidFunction
  next: VoidFunction & { disabled: boolean }
  prev: VoidFunction & { disabled: boolean }
  show: {
    state: RecoilState<string>
    value: number
    set: (show: number) => void
  }
  sortsAndFilters?: SortsAndFilters
}

// const hash = (data: any): string => v5(JSON.stringify(data), v5.DNS)
// console.log(`OPTIONS:`, hash(options))

let loading = false

export const useList = <T, QUERY_OUTPUT>(
  options: ListOptions<T, QUERY_OUTPUT>,
): [Getter<T[]>, ListTools] => {
  const {
    cache,
    queryDefaults,
    every,
    query,
    pullPolicy,
    toList = (queryOutput: QUERY_OUTPUT) =>
      (queryOutput as unknown as { data: T[] }).data,
    toMeta = (queryOutput: QUERY_OUTPUT) =>
      (queryOutput as unknown as { meta: PageMeta }).meta,
    sortsAndFilters = {},
  } = options

  const records = useRecoilValue(cache.findPage(sortsAndFilters))

  const load = cache[USE_LOAD]()
  const sort = cache[USE_INDEX]()

  const [place, setPlace] = useRecoilState(cache.findPlace(sortsAndFilters))
  const { firstIdx, lastIdx, show, page, total } = place

  const view = JSON.stringify(place)

  const pull: PullPage<T> = async (policy) => {
    const cursor = treeShake({
      show,
      page,
    })
    const search = {
      ...queryDefaults,
      ...sortsAndFilters,
      ...cursor,
      show: page === 1 ? show * 4 : show,
    }
    const output = await query(search)
    const list = toList(output)
    const meta = toMeta(output)
    const ids = list.map(cache.accessors.getId)
    load(list, policy ?? pullPolicy)
    sort(ids, { ...meta, ...cursor }, sortsAndFilters)
    setPlace((current) => ({ ...current, total: meta.total }))
    return list
  }

  const lastPulled = useRef(Date.now())
  const lastView = useRef<string | undefined>(undefined)

  const shouldPull = () => {
    const viewDidChange = lastView.current !== view
    const timeHasPassed = lastPulled.current + 1000 < Date.now()
    const viewIsNew = lastView.current === undefined
    lastView.current = view
    // console.log(`viewDidChange: ${viewDidChange}`)
    // console.log(`timeHasPassed: ${timeHasPassed}`)
    // console.log(`viewIsNew: ${viewIsNew}`)
    return viewDidChange && (timeHasPassed || viewIsNew) && !loading
  }

  if (shouldPull()) {
    // console.log(`PULLING`)
    loading = true
    pull().then(() => {
      loading = false
    })
  }

  // @ts-expect-error "not all code paths return a value" -- this is intentional
  useEffect(() => {
    if (every) {
      const timing = parseTimeAmount(every)
      const interval = setInterval(() => {
        if (shouldPull()) pull(`overwrite-clean-fields`)
      }, timing)
      return () => clearInterval(interval)
    }
  }, [pull, every])

  const filler = cache.defaults?.empty
    ? Array(show - records.length).fill(cache.defaults.empty)
    : []

  const getRecords: Getter<T[]> = () => [...records, ...filler] as T[]

  const prev = () => setPlace({ ...place, page: page - 1 })
  const next = () => setPlace({ ...place, page: page + 1 })
  prev.disabled = firstIdx === 0
  next.disabled = lastIdx === total - 1

  const refresh = () => pull(`overwrite-all`)

  return [
    getRecords,
    {
      page,
      total,
      firstIdx,
      lastIdx,
      show: {
        state: cache.findShowCount(sortsAndFilters),
        value: show,
        set: (show: number) =>
          setPlace((current) => ({
            ...current,
            show,
            firstIdx: current.firstIdx,
            lastIdx: current.firstIdx + show - 1,
          })),
      },
      next,
      prev,
      refresh,
    },
  ]
}
