import type { Delta } from "../util/diff"

export type StateToInput<T, QI> = (state?: T) => QI
export type OutboundToInput<T, QI> = (id: string, outbound: Delta<T>) => QI
export type OutputToState<T, QO> = (queryOutput: QO) => T
export type Voidable<T> = T | void

export * from "./create"
export * from "./delta"
export * from "./destroy"
export * from "./pull"
export * from "./push"
export * from "./list"
export * from "./reset"
export * from "./sync"
