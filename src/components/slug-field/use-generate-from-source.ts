'use client'

import { useConfig, useDocumentInfo, useForm, useLocale } from '@payloadcms/ui'
import { useCallback } from 'react'

import { generateSlugFromValue } from '../../fields/generate-slug.js'
import { SLUGIFY_ENDPOINT_PATH } from '../../server/slugify-endpoint.js'

type Args = {
  source: string
  usesCustomSlugify: boolean
  slugLocalized: boolean
  fieldLocalized?: boolean
  schemaPath?: string
}

/** Returns a function that slugifies the current `source` value in the admin form. */
export const useGenerateFromSource = ({
  source,
  usesCustomSlugify,
  slugLocalized,
  fieldLocalized,
  schemaPath,
}: Args) => {
  const { getData, getDataByPath } = useForm()
  const { collectionSlug } = useDocumentInfo()
  const { code: localeCode } = useLocale()
  const {
    config: { routes, serverURL },
  } = useConfig()
  const isSlugLocalized = slugLocalized === true || fieldLocalized === true

  return useCallback(async (): Promise<string | undefined> => {
    const valueToSlugify = getDataByPath(source)

    if (usesCustomSlugify) {
      if (!collectionSlug || !schemaPath) {
        return undefined
      }

      const response = await fetch(`${serverURL ?? ''}${routes.api}${SLUGIFY_ENDPOINT_PATH}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: collectionSlug,
          fieldPath: schemaPath,
          valueToSlugify,
          data: getData(),
        }),
      })
      if (!response.ok) return undefined
      const { slug: result } = (await response.json()) as { slug?: unknown }

      return typeof result === 'string' ? result : undefined
    }

    return generateSlugFromValue(valueToSlugify, {
      localized: isSlugLocalized,
      locale: localeCode,
    })
  }, [
    source,
    collectionSlug,
    getData,
    getDataByPath,
    isSlugLocalized,
    localeCode,
    schemaPath,
    routes.api,
    serverURL,
    usesCustomSlugify,
  ])
}
