import { useRecoilTransaction_UNSTABLE } from "recoil"

import type { ComplexParam, RecoilStateFamily } from "."
import type { SortsAndFilters, PageMeta, Page } from "./hooks"

export type Index = Page<string | undefined>

export type PartialIndex = (string | undefined)[]

export type Indexer = (
  newValues: string[],
  pageMeta: PageMeta,
  sortsAndFilters?: SortsAndFilters,
) => void

export const buildIndexer =
  (
    findIndex: RecoilStateFamily<(string | undefined)[], ComplexParam>,
  ): (() => Indexer) =>
  () =>
    useRecoilTransaction_UNSTABLE(({ set, get }) => {
      return async (ids, meta, sortsAndFilters = {}) => {
        const indexState = findIndex(sortsAndFilters)

        const index = get(indexState) ?? Array.from(Array(meta.total))

        const data = [...index]

        data.splice(meta.firstIdx, ids.length, ...ids)

        set(indexState, data)
      }
    })
