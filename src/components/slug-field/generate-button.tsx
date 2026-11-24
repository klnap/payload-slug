'use client'

import { useSlugTranslation } from './use-slug-t.js'

/** Icon button rendered inside the slug input; generates the slug from `source` on click. */
export const GenerateButton = ({
  onGenerate,
  disabled,
}: {
  onGenerate: () => void | Promise<void>
  disabled?: boolean
}) => {
  const t = useSlugTranslation()
  const label = t('generate')

  return (
    <div className='slug-field__actions'>
      <button
        type='button'
        className='slug-field__generate'
        aria-label={label}
        title={label}
        disabled={disabled}
        onClick={() => {
          void onGenerate()
        }}
      >
        <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'>
          <title>{label}</title>
          <path d='M0 0h24v24H0z' fill='none' />
          <path
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            d='M20 8a8.96 8.96 0 0 0-8.036-5C7.014 3 3 7.03 3 12m1 4a8.96 8.96 0 0 0 8.036 5C16.986 21 21 16.97 21 12M9 16H3v6M21 2v6h-6'
          />
        </svg>
      </button>
    </div>
  )
}
