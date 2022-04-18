import type {
  SetterOrUpdater,
  RecoilState,
  RecoilValueReadOnly,
  SerializableParam,
} from "recoil"

export * from "./cache"
export * from "./getter"
export * from "./hooks"
export * from "./loader"
export * from "./selectDeltas"
export * from "./store"
export * from "./query"

export type Primitive = boolean | number | string | symbol | null | undefined

export type ComplexParam = Exclude<SerializableParam, Primitive>

export type RecoilStateFamily<T, P extends SerializableParam> = (
  param: P,
) => RecoilState<T>

export type RecoilValueFamily<T, P extends SerializableParam> = (
  param: P,
) => RecoilValueReadOnly<T>

export type Setter<T> = SetterOrUpdater<T | undefined>

export type ID = string

export type IdAccessor<T> = (item: T) => ID
