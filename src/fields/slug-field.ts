import { type Field, ValidationError } from 'payload'
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

export const slugField = ({
  source,
  slugify,
  localized = false,
  modeToggle = false,
}: SlugFieldArgs): Field => {
  const usesCustomSlugify = typeof slugify === 'function'

  const slugCustom: SlugFieldCustom = {}
  if (usesCustomSlugify) {
    slugCustom.slugify = slugify
  }

  const clientProps: SlugFieldClientProps = {
    source,
    usesCustomSlugify,
    slugLocalized: localized,
    modeToggle,
  }

  const slug: Field = {
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
        async ({ value, data, originalDoc, siblingData, previousSiblingDoc, operation, req }) => {
          const operationData = (data ?? {}) as Record<string, unknown>
          const original = originalDoc as Record<string, unknown> | null | undefined
          const hasValue = typeof value === 'string' && value.trim() !== ''
          const originalSlug =
            typeof original?.slug === 'string' && original.slug.trim() ? original.slug : undefined

          const slugMode = modeToggle
            ? resolveSlugMode({
                operation,
                siblingData: siblingData as Record<string, unknown> | undefined,
                previousSiblingDoc: previousSiblingDoc as Record<string, unknown> | undefined,
              })
            : 'manual'

          // Without modeToggle a submitted slug is the editor's; generation only fills a gap.
          // `undefined` means the slug was not part of the update, so the stored one stays.
          const generate = modeToggle
            ? slugMode === 'auto'
            : !hasValue && !(value === undefined && originalSlug)

          if (!generate) {
            if (!hasValue) return value === undefined ? originalSlug : value

            const normalized = await produceSlugValue(
              slugify,
              (value as string).replace(/\s+/g, '-'),
              operationData,
              req,
              localized,
            )

            if (normalized?.trim()) return normalized

            // Never store the raw input: it may contain characters the slug rules reject.
            throw new ValidationError({
              errors: [{ message: SLUG_EMPTY_MESSAGE, path: 'slug' }],
            })
          }

          const sourceValue = resolveAutoFromSource(source, operationData, original)
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

          // Draft autosave on create often runs before `source` has a value — use a unique
          // placeholder so `unique` + `required` do not fail; real slug is generated once title exists.
          if (operation === 'create') {
            return hasValue ? value : buildDraftPlaceholderSlug(operationData, req, localized)
          }

          return hasValue ? value : (originalSlug ?? value)
        },
      ],
    },
  }

  if (!modeToggle) return slug

  return {
    type: 'row',
    admin: { className: 'slug-field-row' },
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
        admin: { hidden: true },
      },
      slug,
    ],
  }
}
