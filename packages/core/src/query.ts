import type { SortsAndFilters, Cursor } from "./hooks/list"
import treeShake from "./util/shallowTreeShake"

export type ReadQuery<OUTPUT> = (id: string) => Promise<OUTPUT>
export type ListQuery<OUTPUT> = (
  search?: Cursor & SortsAndFilters,
) => Promise<OUTPUT>
export type CreateQuery<INPUT, OUTPUT> = (input: INPUT) => Promise<OUTPUT>
export type UpdateQuery<INPUT, OUTPUT> = (input: INPUT) => Promise<OUTPUT>
export type DestroyQuery = (id: string) => Promise<any>

export type QueryOptions = {
  method?: `DELETE` | `GET` | `PATCH` | `POST`
  headers?: Record<string, string>
  input?: any
  search?: Record<string, any>
}

export const query = async <T>(
  endpoint: string,
  options?: QueryOptions,
): Promise<T> => {
  const search = new URLSearchParams(treeShake(options?.search) ?? {}).toString()
  // console.log(options?.search)
  // console.log(`search: ${search}`)
  const response = await fetch(
    `${endpoint}${options?.search ? `?` + search : ``}`,
    {
      method: options?.method || `GET`,
      headers: options?.input
        ? { ...options?.headers, "Content-Type": `application/json` }
        : options?.headers,
      body: JSON.stringify(options?.input),
    },
  )
  if (!response.ok) {
    throw response
  }
  const json = await response.json()
  return json as T
}
