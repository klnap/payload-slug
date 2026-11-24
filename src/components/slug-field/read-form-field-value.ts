type FormFieldState = {
  value?: unknown
}

/** Read a document path from Payload admin form field state (for `useFormFields`). */
export const readFormFieldValue = (
  fields: Record<string, FormFieldState>,
  path: string,
): unknown => {
  const segments = path.split('.').filter(Boolean)
  if (segments.length === 0) {
    return undefined
  }

  let fieldMap: Record<string, FormFieldState> | undefined = fields
  let data: unknown

  for (const segment of segments) {
    if (fieldMap && segment in fieldMap) {
      data = fieldMap[segment]?.value
      fieldMap = undefined
      continue
    }

    if (data && typeof data === 'object' && segment in data) {
      data = (data as Record<string, unknown>)[segment]
      continue
    }

    return undefined
  }

  return data
}
