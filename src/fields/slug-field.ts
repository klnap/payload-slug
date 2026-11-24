import { type RowField, ValidationError } from 'payload'
import { SLUG_FIELD_IMPORT_PATH } from '../integration/import-map-paths.js'
import type { SlugFieldArgs, SlugFieldClientProps, SlugifyFunction } from '../types.js'
import { generateSlugFromValue } from './generate-slug.js'
import { resolveAutoFromSource } from './resolve-auto-from-source.js'
import { resolveSlugMode } from './slug-mode.js'

type SlugFieldCustom = {
  slugify?: SlugifyFunction
}

const SLUG_EMPTY_MESSAGE = 'Slug must contain at least one letter or digit'

const produceSlugValue = async (
  slugifyFn: SlugifyFunction | undefined,
  valueToSlugify: unknown,
  data: Record<string, unknown>,
  req: Parameters<SlugifyFunction>[0]['req'],
  slugLocalized: boolean,
): Promise<string | undefined> => {
  if (slugifyFn) {
    return await slugifyFn({ valueToSlugify, data, req })
  }

  return generateSlugFromValue(valueToSlugify, { localized: slugLocalized, locale: req.locale })
}

const buildDraftPlaceholderSlug = (
  data: Record<string, unknown>,
  req: { locale?: string | null },
  slugLocalized: boolean,
): string => {
  const id =
    typeof data.id === 'string' && data.id.trim() ? data.id.trim() : globalThis.crypto.randomUUID()
  const base = `draft-${id}`
  if (!slugLocalized) return base
  const locale = typeof req.locale === 'string' && req.locale.trim() ? req.locale.trim() : 'default'
  return `${base}-${locale}`
}

export const slugField = ({ autoFrom, slugify, localized = false }: SlugFieldArgs): RowField => {
  const usesCustomSlugify = typeof slugify === 'function'

  const slugCustom: SlugFieldCustom = {}
  if (usesCustomSlugify) {
    slugCustom.slugify = slugify
  }

  const clientProps: SlugFieldClientProps = {
    autoFrom,
    usesCustomSlugify,
    slugLocalized: localized,
  }
  return {
    type: 'row',
    admin: {
      className: 'slug-field-row',
    },
    fields: [
      {
        name: 'slugMode',
        type: 'select',
        defaultValue: 'auto',
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Manual', value: 'manual' },
        ],
        localized,
        admin: {
          hidden: true,
        },
      },
      {
        name: 'slug',
        type: 'text',
        required: true,
        unique: true,
        index: true,
        localized,
        admin: {
          components: {
            Field: {
              path: SLUG_FIELD_IMPORT_PATH,
              clientProps,
            },
          },
        },
        custom: slugCustom,
        hooks: {
          beforeChange: [
            async ({
              value,
              data,
              originalDoc,
              siblingData,
              previousSiblingDoc,
              operation,
              req,
            }) => {
              const slugMode = resolveSlugMode({
                operation,
                siblingData: siblingData as Record<string, unknown> | undefined,
                previousSiblingDoc: previousSiblingDoc as Record<string, unknown> | undefined,
              })

              if (slugMode === 'manual') {
                if (typeof value !== 'string' || !value.trim()) {
                  return value
                }

                const prepared = value.replace(/\s+/g, '-')
                const normalized = await produceSlugValue(
                  slugify,
                  prepared,
                  (data ?? {}) as Record<string, unknown>,
                  req,
                  localized,
                )

                if (normalized?.trim()) return normalized

                // Never store the raw input: it may contain characters the slug rules reject.
                throw new ValidationError({
                  errors: [{ message: SLUG_EMPTY_MESSAGE, path: 'slug' }],
                })
              }

              const operationData = (data ?? {}) as Record<string, unknown>
              const original = originalDoc as Record<string, unknown> | null | undefined
              const sourceValue = resolveAutoFromSource(autoFrom, operationData, original)
              const generated = await produceSlugValue(
                slugify,
                sourceValue,
                operationData,
                req,
                localized,
              )

              if (generated?.trim()) {
                return generated
              }

              // Draft autosave on create often runs before `autoFrom` has a value — use a unique
              // placeholder so `unique` + `required` do not fail; real slug is generated once title exists.
              if (operation === 'create') {
                if (typeof value === 'string' && value.trim()) {
                  return value
                }
                return buildDraftPlaceholderSlug(operationData, req, localized)
              }

              const existing =
                typeof value === 'string' && value.trim()
                  ? value
                  : typeof original?.slug === 'string'
                    ? original.slug
                    : value

              return existing
            },
          ],
        },
      },
    ],
  }
}
