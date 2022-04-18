import { serializeResource } from "@eyecuelab/json-api-tools"
import type { Json, JsonObj, JsonApiDocument } from "@eyecuelab/json-api-tools"
import { faker } from "@faker-js/faker"
import type { Template } from "@prisma/client"
import type { PageMeta } from "@recash/core"
import type { Server } from "miragejs"
import {
  Serializer,
  JSONAPISerializer,
  Factory,
  Model,
  createServer,
  Response,
} from "miragejs"
import { v5 as uuid } from "uuid"

import { UNITED_STATES } from "./constants/UNITED_STATES"
import type { DocusignProfile } from "./state/profile"
import type { TemplateResource } from "./state/template"
import { EMPTY_TEMPLATE_FLAT, DOCUMENT_TYPES } from "./state/template"

const ACCOUNT_UUID = uuid(`ACCOUNT`, uuid.DNS)
const ORG_UUID = uuid(`ORG`, uuid.DNS)

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

const randomKw = () =>
  faker.datatype.number({ min: 1, max: 4 }) === 4
    ? faker.datatype.number({ min: 100, max: 10000 })
    : null
class MySerializer extends JSONAPISerializer {
  // include(request: Request, modelName: string) {
  //   return this.schema.all(modelName).models
  // },
  // public serialize(...args: any) {
  //   // debugger // eslint-disable-line
  //   try {
  //     delete (args[0] as { attributes: JsonObj }).attributes.type
  //   } catch (e) {} // eslint-disable-line
  //   const foo = (JSONAPISerializer as any).prototype.serialize.apply(
  //     this,
  //     ...args
  //   )
  //   console.log(foo)
  //   return foo
  // }
  public keyForAttribute(key: string) {
    return key
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public serialize(...args: any) {
    // This is how to call super, as Mirage borrows [Backbone's implementation of extend](http://backbonejs.org/#Model-extend)
    try {
      console.log(args)
      delete args[0].attrs.type
    } catch (e) {
      console.log(e)
    } // eslint-disable-line

    // @ts-expect-error whatever
    const json = Serializer.prototype.serialize.apply(this, args)

    // Add metadata, sort parts of the response, etc.

    return json
  }
}

export function startMirage({ environment = `test` } = {}): Server {
  return createServer({
    environment,

    serializers: {
      application: MySerializer,
    },

    factories: {
      template: Factory.extend<Template>({
        ...EMPTY_TEMPLATE_FLAT,
        createdAt: faker.date.past(),
        updatedAt: null,
        id: (n) => uuid(n.toString(), uuid.DNS),
        docType: () => faker.random.arrayElement(DOCUMENT_TYPES),
        apiAccountId: ACCOUNT_UUID,
        states: () => [
          ...new Set(
            faker.datatype
              .array(faker.datatype.number({ min: 1, max: 5 }))
              .map(() => faker.random.arrayElement(UNITED_STATES)),
          ),
        ],
        utilityCompanyName: faker.company.companyName(),
        utilityPlanNames: [],
        isActive: () => faker.datatype.boolean(),
        minimumKw: () => randomKw(),
        maximumKw: () => randomKw(),
        city: () => faker.address.city(),
        county: () => faker.address.county(),
        basePath: () => faker.internet.url(),
        docsPath: () => faker.internet.url(),
        name: () => {
          const state = faker.address.state()
          return (
            capitalize(faker.lorem.word()) +
            ` ` +
            state +
            ` ` +
            faker.address.zipCodeByState(state)
          )
        },
      }),
      profile: Factory.extend<Partial<DocusignProfile>>(
        (() => {
          const given_name = faker.name.firstName()
          const family_name = faker.name.lastName()
          return {
            sub: faker.datatype.uuid(),
            name: `${given_name} ${family_name}`,
            given_name,
            family_name,
            created: new Date().toDateString(),
            email: faker.internet.email(),
            accounts: [
              {
                account_id: ACCOUNT_UUID,
                is_default: true,
                account_name: faker.company.companyName(),
                base_uri: ``,
                organization: {
                  organization_id: ORG_UUID,
                  links: [{ rel: ``, href: `` }],
                },
              },
            ],
          }
        })(),
      ),
    },

    models: {
      template: Model.extend<Template>(EMPTY_TEMPLATE_FLAT),
      profile: Model.extend<Partial<DocusignProfile>>({}),
    },

    routes() {
      this.namespace = `api`

      this.get(
        `template`,
        (
          schema,
          { queryParams },
        ): JsonApiDocument<TemplateResource[], PageMeta> => {
          const show = parseInt(queryParams.show)
          const page = parseInt(queryParams.page)
          const templates = schema.all(`template`)
          const total = templates.length
          const firstIdx = Math.max((page - 1) * show, 0)
          const lastIdx = Math.min(firstIdx + show - 1, total)
          const shown = templates.slice(firstIdx, page * show)
          return {
            jsonapi: {
              version: `1.0`,
            },
            data: shown.models.map((t) =>
              serializeResource(t.attrs, `template`, t.id),
            ),
            meta: {
              show,
              page,
              total,
              firstIdx,
              lastIdx,
            },
          }
        },
      )
      this.get(
        `/template/:id`,
        // (schema, request) => {
        //   const { id } = request.params
        //   const template = schema.find(`template`, id)
        //   return template
        //     ? {
        //     data: serializeResource(template.attrs, `template`, template.id),
        //       }
        //     : new Response(404)
        // },
        // { timing: environment === `test` ? 0 : 1000 }
      )
      this.post(`/template`, () => {
        // console.log(request)
        const template = this.create(`template`)
        return {
          data: serializeResource(template.attrs, `template`, template.id),
        }
      })
      this.patch(`/template/:id`, (schema, request) => {
        const { id } = request.params
        const template = schema.find(`template`, id)
        const updateInput = JSON.parse(request.requestBody)
        if (template) template.update(updateInput)
        return template
          ? { data: serializeResource(template.attrs, `template`, template.id) }
          : new Response(404)
      })

      this.namespace = `auth`

      this.get(`/docusign/profile`, (schema, request) => {
        const profile = schema.first(`profile`)
        return profile ? profile.attrs : new Response(404)
        // return new Response(401)
      })
    },

    seeds(server) {
      server.create(`profile`)
      server.createList(`template`, 20)
    },
  })
}
