import type {
  Resource,
  ResourceObject,
  RO,
  JsonObj,
} from "@eyecuelab/json-api-tools"
import { selectorFamily, DefaultValue } from "recoil"

import type { RecoilStateFamily } from "."
import type { Cache } from "./cache"

export const pickState = <T extends JsonObj, KEY extends keyof T>(
  cache: Cache<T>,
  key: KEY,
): RecoilStateFamily<T[KEY], string> =>
  selectorFamily<T[KEY], string>({
    key: `${cache.key}-${String(key)}`,
    get:
      (id) =>
      ({ get }) => {
        const value = get(cache.findState(id))
        if (value === undefined) throw new Error(`${id} not found`)
        return value[key]
      },
    set:
      (id) =>
      ({ set, reset }, value: DefaultValue | T[KEY]) => {
        const state = cache.findState(id)
        if (value instanceof DefaultValue) {
          reset(state)
          return
        }
        set(state, (current) =>
          current ? { ...current, [key]: value } : undefined,
        )
      },
  })

export const pickAttribute = <
  RESOURCE extends Resource,
  RESOURCE_OBJ extends ResourceObject<RESOURCE>,
  KEY extends keyof RO<RESOURCE>[`attributes`],
>(
  cache: Cache<RESOURCE_OBJ>,
  key: KEY,
): RecoilStateFamily<RESOURCE_OBJ[`attributes`][KEY], string> =>
  selectorFamily<RESOURCE_OBJ[`attributes`][KEY], string>({
    key: `${cache.key}-attr-${String(key)}`,
    get:
      (id) =>
      ({ get }) => {
        const value = get(cache.findState(id))
        if (value === undefined) throw new Error(`${id} not found`)
        // if (value[`attributes`] === undefined) {
        //   throw new Error(`${id} has no attributes`)
        // }
        return value[`attributes`][key]
      },
    set:
      (id) =>
      ({ set }, value: DefaultValue | RESOURCE_OBJ[`attributes`][KEY]) => {
        const state = cache.findState(id)
        if (value instanceof DefaultValue) {
          return console.warn(
            `invalid reset on picked attribute ${String(key)} in ${cache.key}`,
          )
        }
        set(state, (current) =>
          current
            ? { ...current, attributes: { ...current.attributes, [key]: value } }
            : undefined,
        )
      },
  })
