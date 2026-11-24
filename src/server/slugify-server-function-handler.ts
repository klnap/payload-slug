import {
  executeAccess,
  flattenAllFields,
  getFieldByPath,
  type SanitizedCollectionConfig,
  type SanitizedConfig,
  UnauthorizedError,
} from 'payload'

import { generateSlugFromValue } from '../fields/generate-slug.js'
import { SLUGIFY_SERVER_FUNCTION_NAME } from '../integration/server-function-name.js'

export type SlugifyServerFunctionArgs = {
  collection: string
  fieldPath: string
  valueToSlugify: unknown
  data: Record<string, unknown>
}

type HandlerArgs = SlugifyServerFunctionArgs & {
  req: {
    user?: unknown
    locale?: unknown
    payload: {
      config: SanitizedConfig
      collections: Record<string, { config: SanitizedCollectionConfig }>
    }
  }
}

export const handleSlugifyServerFunction = async (
  config: SanitizedConfig,
  args: SlugifyServerFunctionArgs,
  req: HandlerArgs['req'],
): Promise<string | undefined> => {
  if (!req.user) {
    throw new UnauthorizedError()
  }

  const { collection, fieldPath, valueToSlugify, data } = args

  const collectionConfig = req.payload.collections[collection]?.config
  if (!collectionConfig) {
    throw new Error(`Unknown collection: ${collection}`)
  }

  // Why: this endpoint slugifies caller-supplied data, so it must not work for callers who cannot read the collection.
  await executeAccess({ collectionConfig, req: req as never }, collectionConfig.access.read)

  const flattened = flattenAllFields({ fields: collectionConfig.fields })
  const resolved = getFieldByPath({
    config,
    fields: flattened,
    path: fieldPath,
  })

  if (!resolved?.field) {
    throw new Error(`Unknown slug field: ${collection}.${fieldPath}`)
  }

  const customSlugify = resolved.field.custom?.slugify
  if (typeof customSlugify === 'function') {
    return await customSlugify({ valueToSlugify, data, req: req as never })
  }

  const slugLocalized = resolved.field.localized === true
  return generateSlugFromValue(valueToSlugify, { localized: slugLocalized, locale: req.locale })
}

export const createSlugifyServerFunctionHandler =
  (config: SanitizedConfig | Promise<SanitizedConfig>) =>
  async (args: HandlerArgs): Promise<string | undefined> => {
    const resolvedConfig = await config
    const { req, ...fnArgs } = args
    return handleSlugifyServerFunction(resolvedConfig, fnArgs, req)
  }

/** Spread into admin `handleServerFunctions` (same idea as `@klnap/payload-schedule`’s `scheduleServerFunctions`). */
export const createSlugServerFunctions = (config: SanitizedConfig | Promise<SanitizedConfig>) =>
  ({
    [SLUGIFY_SERVER_FUNCTION_NAME]: createSlugifyServerFunctionHandler(config),
  }) as const
