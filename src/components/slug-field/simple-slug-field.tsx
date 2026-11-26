"use client";

import { FieldLabel, TextInput, useField, useFormFields } from "@payloadcms/ui";
import { type ChangeEvent, useEffect, useRef } from "react";
import { GenerateButton } from "./generate-button.js";
import { readFormFieldValue } from "./read-form-field-value.js";
import type { SlugFieldProps } from "./slug-field.js";
import { useGenerateFromSource } from "./use-generate-from-source.js";

import "../../styles/slug-field.css";

/**
 * Plain slug input. While it is empty (or still holds the value this component generated and the
 * editor has not typed), it follows `source`. A stored or typed slug is never overwritten.
 */
export const SimpleSlugField = ({
  source,
  usesCustomSlugify,
  slugLocalized,
  field,
  path,
  schemaPath,
}: SlugFieldProps) => {
  const slugPath = path || field.name;
  const { value, setValue, disabled, showError } = useField<string>({ path: slugPath });
  const generateFromSource = useGenerateFromSource({
    source,
    usesCustomSlugify,
    slugLocalized,
    fieldLocalized: field.localized,
    schemaPath,
  });
  const watchedSource = useFormFields(([fields]) =>
    readFormFieldValue(fields as Record<string, { value?: unknown }>, source),
  );

  const current = typeof value === "string" ? value : "";
  const lastGeneratedRef = useRef<string | null>(null);
  const formDisabled = disabled || field.admin?.readOnly === true;

  useEffect(() => {
    // Reading the subscribed value makes source changes trigger the effect and cancel stale work.
    void watchedSource;
    if (formDisabled || (current !== "" && current !== lastGeneratedRef.current)) return;
    if (current === lastGeneratedRef.current) return;

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      const next = (await generateFromSource()) ?? "";
      if (cancelled || next === current) return;
      lastGeneratedRef.current = next;
      setValue(next);
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [current, formDisabled, generateFromSource, setValue, watchedSource]);

  return (
    <TextInput
      AfterInput={
        formDisabled ? undefined : (
          <GenerateButton
            onGenerate={async () => {
              const next = (await generateFromSource()) ?? "";
              lastGeneratedRef.current = next;
              setValue(next);
            }}
          />
        )
      }
      className="slug-field"
      Label={
        <FieldLabel
          label={field.label || field.name}
          localized={field.localized}
          path={slugPath}
          required={field.required}
        />
      }
      localized={field.localized}
      onChange={(event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value)}
      path={slugPath}
      readOnly={formDisabled}
      required={field.required}
      showError={showError}
      value={current}
    />
  );
};
