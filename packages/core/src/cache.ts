import { atomFamily, DefaultValue, selector, selectorFamily } from "recoil"

import type { ID, IdAccessor, RecoilStateFamily, RecoilValueFamily } from "."
import type { SortsAndFilters, PageMeta, Page } from "./hooks/list"
import type { Indexer } from "./indexer"
import { buildIndexer } from "./indexer"
import type { Loader } from "./loader"
import { buildLoader } from "./loader"
import type { Deltas } from "./selectDeltas"
import { selectDeltas } from "./selectDeltas"
import type { Defaults } from "./store"

export const USE_LOAD = Symbol(`USE_LOAD`)
export const USE_INDEX = Symbol(`USE_INDEX`)

export type CacheOptions<T> = {
  key: string
  getId?: IdAccessor<T>
  defaults?: Defaults<T>
}

export type Cache<T> = {
  key: string
  findState: RecoilStateFamily<T | undefined, string>
  findRemoteState: RecoilStateFamily<T | undefined, string>
  findDeltas: RecoilValueFamily<Deltas<T>, string>
  findIndex: RecoilStateFamily<(string | undefined)[], SortsAndFilters>
  findPage: RecoilValueFamily<(T | undefined)[], SortsAndFilters>
  findPlace: RecoilStateFamily<PageMeta, SortsAndFilters>
  findShowCount: RecoilStateFamily<string, SortsAndFilters>
  [USE_LOAD]: () => Loader<T>
  [USE_INDEX]: () => Indexer
  accessors: {
    getId: IdAccessor<T>
  }
  defaults?: Defaults<T>
}
export const createCache = <T>({
  key,
  getId = (item) => (item as unknown as { id: ID }).id,
  defaults,
}: CacheOptions<T>): Cache<T> => {
  const findRemoteState = atomFamily<T | undefined, ID>({
    key: `${key}Remote`,
    default: undefined,
  })
  const findState = atomFamily<T | undefined, ID>({
    key: `${key}Local`,
    default: undefined,
  })

  const findIndex = atomFamily<(string | undefined)[], SortsAndFilters>({
    key: `${key}Index`,
    default: [],
  })
  const _findPlace = atomFamily<
    Omit<PageMeta, `firstIdx` | `lastIdx`>,
    SortsAndFilters
  >({
    key: `_${key}Place`,
    default: {
      page: 1,
      show: defaults?.listLength ?? 777,
      total: 999,
    },
  })

  const findPlace = selectorFamily<PageMeta, SortsAndFilters>({
    key: `${key}IndexCursor`,
    get:
      (sortsAndFilters) =>
      ({ get }) => {
        const place = get(_findPlace(sortsAndFilters))
        return {
          ...place,
          firstIdx: Math.max(place.page * place.show - place.show, 0),
          lastIdx: Math.min(place.page * place.show - 1, place.total - 1),
        }
      },
    set:
      (sortsAndFilters) =>
      ({ set, reset }, value: DefaultValue | PageMeta) => {
        if (value instanceof DefaultValue) {
          reset(_findPlace(sortsAndFilters))
        } else {
          const { page, show, total } = value
          const fixedPage = page * show > total ? Math.ceil(total / show) : page
          const fixedShow = show > total ? total : show
          set(_findPlace(sortsAndFilters), {
            page: fixedPage,
            show: fixedShow,
            total,
          })
        }
      },
  })

  const findShowCount = selectorFamily<string, SortsAndFilters>({
    key: `${key}ShowCount`,
    get:
      (sortsAndFilters) =>
      ({ get }) => {
        const { show } = get(findPlace(sortsAndFilters))
        return `${show}`
      },
    set:
      (sortsAndFilters) =>
      ({ set }, value: DefaultValue | string) => {
        if (value instanceof DefaultValue) {
          set(findPlace(sortsAndFilters), (current) => ({
            ...current,
            show: defaults?.listLength ?? 777,
          }))
        } else {
          const show = parseInt(value, 10)
          set(findPlace(sortsAndFilters), (current) => ({
            ...current,
            show,
          }))
        }
      },
  })

  const findPage = selectorFamily<(T | undefined)[], SortsAndFilters>({
    key: `${key}Page`,
    get:
      (sortsAndFilters) =>
      ({ get }) => {
        const index = get(findIndex(sortsAndFilters))
        const place = get(findPlace(sortsAndFilters))
        const idsInView = index.slice(place.firstIdx, place.lastIdx + 1)
        const recordsInView = idsInView.map((id) =>
          id ? get(findRemoteState(id)) : defaults?.empty,
        )
        return recordsInView
      },
  })

  const findDeltas = selectDeltas(findState, findRemoteState, key)

  const useLoad = buildLoader<T>({
    getId: getId,
    local: findState,
    remote: findRemoteState,
  })

  const useIndex = buildIndexer(findIndex)

  return {
    key,
    findState,
    findRemoteState,
    findDeltas,
    findIndex,
    findPlace,
    findShowCount,
    findPage,
    [USE_LOAD]: useLoad,
    [USE_INDEX]: useIndex,
    accessors: {
      getId,
    },
    defaults,
  }
}
