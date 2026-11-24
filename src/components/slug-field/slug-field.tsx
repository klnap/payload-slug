'use client'

import { FieldLabel, TextInput, useField, useForm, useFormFields } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'
import { type ChangeEvent, useCallback, useEffect, useRef } from 'react'
import type { SlugFieldClientProps, SlugMode } from '../../types.js'
import { readFormFieldValue } from './read-form-field-value.js'
import { SimpleSlugField } from './simple-slug-field.js'
import { slugModePathFromSlugPath } from './slug-mode-path.js'
import { useGenerateFromSource } from './use-generate-from-source.js'
import { useSlugTranslation } from './use-slug-t.js'

import '../../styles/slug-field.css'

export type SlugFieldProps = TextFieldClientProps & SlugFieldClientProps

const isSlugMode = (value: unknown): value is SlugMode => value === 'auto' || value === 'manual'

const slugFieldLayoutStyle = {
  flex: '1 1 auto',
  width: '100%',
  minWidth: 0,
} as const

const ModeToggleSlugField = ({
  source,
  usesCustomSlugify,
  slugLocalized,
  field,
  path,
  schemaPath,
}: SlugFieldProps) => {
  const slugPath = path || field.name
  const slugModePath = slugModePathFromSlugPath(slugPath)

  const {
    value: slugValue,
    setValue: setSlug,
    disabled,
    showError,
  } = useField<string>({ path: slugPath })
  const { value: slugModeValue, setValue: setSlugMode } = useField<string>({ path: slugModePath })

  const slugMode: SlugMode = isSlugMode(slugModeValue) ? slugModeValue : 'auto'

  const { getDataByPath } = useForm()
  const t = useSlugTranslation()

  const lastManualSlugRef = useRef<string | null>(null)
  const liveSyncGenerationRef = useRef(0)

  const watchedSourceValue = useFormFields(([fields]) =>
    readFormFieldValue(fields as Record<string, { value?: unknown }>, source),
  )

  const readOnlyFromProps = field.admin?.readOnly === true
  const formDisabled = disabled || readOnlyFromProps
  const isAuto = slugMode === 'auto'
  const inputReadOnly = formDisabled || isAuto

  const hasInitializedManualRef = useRef(false)

  // Persisted manual document only — not when entering Manual from Auto without edits.
  useEffect(() => {
    if (hasInitializedManualRef.current || slugMode !== 'manual') {
      return
    }

    hasInitializedManualRef.current = true
    const persisted = typeof slugValue === 'string' ? slugValue : ''
    lastManualSlugRef.current = persisted.trim() ? persisted : ''
  }, [slugMode, slugValue])

  const generateFromSource = useGenerateFromSource({
    source,
    usesCustomSlugify,
    slugLocalized,
    fieldLocalized: field.localized,
    schemaPath,
  })

  const applyGeneratedSlug = useCallback(
    async (generationId: number) => {
      const next = await generateFromSource()
      if (generationId !== liveSyncGenerationRef.current) {
        return
      }

      const currentMode = getDataByPath(slugModePath)
      if (currentMode !== 'auto') {
        return
      }

      const resolved = typeof next === 'string' ? next : ''
      const currentSlug = getDataByPath(slugPath)
      const currentSlugString = typeof currentSlug === 'string' ? currentSlug : ''

      if (resolved !== currentSlugString) {
        setSlug(resolved)
      }
    },
    [generateFromSource, getDataByPath, setSlug, slugModePath, slugPath],
  )

  useEffect(() => {
    if (!isAuto || formDisabled) {
      return
    }

    const generationId = ++liveSyncGenerationRef.current

    const timeout = window.setTimeout(() => {
      void applyGeneratedSlug(generationId)
    }, 150)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [applyGeneratedSlug, source, formDisabled, isAuto, watchedSourceValue])

  const toggleMode = useCallback(async () => {
    if (formDisabled) return

    if (slugMode === 'auto') {
      liveSyncGenerationRef.current += 1
      setSlugMode('manual')
      const restored = lastManualSlugRef.current
      // Prior manual edit (or loaded manual doc): restore. Otherwise keep current auto slug.
      if (typeof restored === 'string' && restored.trim()) {
        setSlug(restored)
      }
      return
    }

    setSlugMode('auto')
    const generationId = ++liveSyncGenerationRef.current
    await applyGeneratedSlug(generationId)
  }, [applyGeneratedSlug, formDisabled, setSlug, setSlugMode, slugMode])

  const modeLabel = slugMode === 'auto' ? t('switchToManual') : t('switchToAuto')
  const modeToggleText = slugMode === 'auto' ? t('modeAuto') : t('modeManual')

  return (
    <TextInput
      className='slug-field'
      Label={
        <div className='slug-field__label-row'>
          <FieldLabel
            label={field.label || field.name}
            localized={field.localized}
            path={slugPath}
            required={field.required}
          />
          <button
            type='button'
            className='slug-field__mode-toggle'
            aria-label={modeLabel}
            title={modeLabel}
            onClick={() => {
              void toggleMode()
            }}
            disabled={formDisabled}
          >
            {modeToggleText}
          </button>
        </div>
      }
      localized={field.localized}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        if (inputReadOnly) return
        const next = event.target.value
        setSlug(next)
        if (slugMode === 'manual') {
          hasInitializedManualRef.current = true
          lastManualSlugRef.current = next
        }
      }}
      path={slugPath}
      readOnly={inputReadOnly}
      required={field.required}
      showError={showError}
      style={slugFieldLayoutStyle}
      value={typeof slugValue === 'string' ? slugValue : ''}
    />
  )
}

export const SlugField = (props: SlugFieldProps) =>
  props.modeToggle ? <ModeToggleSlugField {...props} /> : <SimpleSlugField {...props} />
