import { createCache, useCreate, useDestroy, usePull, usePush, useSync } from "."
import type {
  Create,
  Destroy,
  Getter,
  Pull,
  Push,
  Sync,
  TimeAmount,
  IdAccessor,
  Cache,
  ComplexParam,
} from "."
import type { AUTO_SAVE, StateToInput, SortsAndFilters, Cursor } from "./hooks"
import type { ListTools } from "./hooks/list"
import { useList } from "./hooks/list"
import type {
  CreateQuery,
  DestroyQuery,
  ListQuery,
  ReadQuery,
  UpdateQuery,
} from "./query"
import type { Delta } from "./util/diff"

type Accessors<T, CREATE_INPUT, UPDATE_INPUT, READ_OUTPUT, LIST_OUTPUT> = {
  getId?: IdAccessor<T>
  toCreate?: StateToInput<T, CREATE_INPUT>
  toUpdate?: (state: T, delta: Delta<T>) => UPDATE_INPUT
  deserialize?: (output: LIST_OUTPUT | READ_OUTPUT) => T[]
}

export type Defaults<T> = { listLength?: number; empty?: T }

export const store = <
  T,
  QUERIES extends {
    read: ReadQuery<READ_OUTPUT>
    list?: (
      search?: (ComplexParam & Cursor) | undefined,
    ) => Promise<LIST_OUTPUT> | undefined
    create?: CreateQuery<CREATE_INPUT, READ_OUTPUT> | undefined
    update?: UpdateQuery<UPDATE_INPUT, READ_OUTPUT> | undefined
    destroy?: DestroyQuery | undefined
  },
  LIST_OUTPUT,
  CREATE_INPUT = T,
  UPDATE_INPUT = T,
  READ_OUTPUT = T,
>({
  key,
  queries,
  accessors,
  defaults = {},
}: {
  key: string
  queries: QUERIES
  defaults?: Defaults<T>
  accessors?: Accessors<T, CREATE_INPUT, UPDATE_INPUT, READ_OUTPUT, LIST_OUTPUT>
}): Cache<T> & {
  useRead: (id: string, every?: TimeAmount) => Getter<T>
  useEdit: QUERIES[`update`] extends UpdateQuery<UPDATE_INPUT, READ_OUTPUT>
    ? Sync<T, Push<T>, Pull<T>>
    : undefined
  useCreate: QUERIES[`create`] extends CreateQuery<CREATE_INPUT, READ_OUTPUT>
    ? () => (input?: T) => Create<T>
    : undefined
  useDestroy: QUERIES[`destroy`] extends DestroyQuery
    ? () => (id: string) => Destroy<T>
    : undefined
  useList: QUERIES[`list`] extends ListQuery<LIST_OUTPUT>
    ? (
        sortsAndFilters?: SortsAndFilters,
        every?: TimeAmount,
      ) => [Getter<T[]>, ListTools]
    : undefined
} => {
  const cache = createCache({
    key,
    getId: accessors?.getId,
    defaults,
  })

  function usePullItem() {
    return usePull({
      cache,
      query: queries.read,
      deserialize: accessors?.deserialize,
    })
  }

  const usePushItem =
    queries.update === undefined
      ? undefined
      : function () {
          return usePush<T, UPDATE_INPUT, READ_OUTPUT>({
            cache,
            query: queries.update as UpdateQuery<UPDATE_INPUT, READ_OUTPUT>,
            serialize: accessors?.toUpdate,
            deserialize: accessors?.deserialize,
          })
        }

  return {
    ...cache,

    useRead: (id: string, every?: TimeAmount) =>
      useSync({
        id,
        cache,
        every,
        pull: usePullItem(),
      }),

    // @ts-expect-error typescript doesn't get it
    useEdit:
      queries.update !== undefined // i'm even being explicit here
        ? (id: string, every?: TimeAmount, autoSave?: typeof AUTO_SAVE) => {
            const pull = usePullItem()
            const push = usePushItem ? usePushItem() : undefined
            return useSync({
              id,
              cache,
              pull,
              push,
              every,
              autoSave,
            })
          }
        : undefined,

    // @ts-expect-error maybe someday
    useCreate:
      queries.create !== undefined
        ? () =>
            useCreate({
              cache,
              query: queries.create as CreateQuery<CREATE_INPUT, READ_OUTPUT>,
              toInput: accessors?.toCreate,
            })
        : undefined,

    // @ts-expect-error for real you're making me do this typescript ;_;
    useDestroy:
      queries.destroy !== undefined
        ? () =>
            useDestroy({
              cache,
              query: queries.destroy as DestroyQuery,
            })
        : undefined,

    // @ts-expect-error this is so simple
    useList:
      queries.list !== undefined
        ? (sortsAndFilters, every) =>
            useList<T, LIST_OUTPUT>({
              cache,
              every,
              sortsAndFilters,
              query: queries.list as ListQuery<LIST_OUTPUT>,
              queryDefaults: { show: defaults.listLength },
              toList: accessors?.deserialize,
              toMeta: undefined,
            })
        : undefined,
  }
}
