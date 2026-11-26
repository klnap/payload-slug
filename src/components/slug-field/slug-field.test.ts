import { expect, mock, test } from "bun:test";
import type { SlugFieldProps } from "./slug-field.js";

let disabled = false;
let slugValue = "";
let hookCursor = 0;
let effects: Array<() => undefined | (() => void)> = [];
const refs: Array<{ current: unknown }> = [];
const slugUpdates: string[] = [];
let scheduled: (() => void) | undefined;
let resolveSlug: ((value: string) => void) | undefined;

mock.module("react", () => ({
  useCallback: (callback: (...args: never[]) => unknown) => callback,
  useEffect: (effect: () => undefined | (() => void)) => effects.push(effect),
  useRef: (initial: unknown) => {
    const index = hookCursor++;
    if (refs[index]) return refs[index];
    const ref = { current: initial };
    refs[index] = ref;
    return ref;
  },
}));

mock.module("react/jsx-runtime", () => ({
  Fragment: Symbol("Fragment"),
  jsx: (type: unknown, props: unknown) => (typeof type === "function" ? type(props) : null),
  jsxs: (type: unknown, props: unknown) => (typeof type === "function" ? type(props) : null),
}));

mock.module("@payloadcms/ui", () => ({
  FieldLabel: "label",
  TextInput: "input",
  useField: ({ path }: { path: string }) =>
    path === "slug"
      ? {
          value: slugValue,
          setValue: (value: string) => {
            slugValue = value;
            slugUpdates.push(value);
          },
          disabled,
          showError: false,
        }
      : { value: "auto", setValue: () => undefined },
  useForm: () => ({
    getDataByPath: (path: string) => (path === "slug" ? slugValue : "auto"),
  }),
  useFormFields: (selector: (args: [Record<string, { value?: unknown }>]) => unknown) =>
    selector([{ title: { value: "Title" } }]),
}));

mock.module("./use-generate-from-source.js", () => ({
  useGenerateFromSource: () => () =>
    new Promise<string>((resolve) => {
      resolveSlug = resolve;
    }),
}));
mock.module("./use-slug-t.js", () => ({ useSlugTranslation: () => (key: string) => key }));

const { SlugField } = await import("./slug-field.js");

const props = {
  modeToggle: true,
  source: "title",
  usesCustomSlugify: true,
  slugLocalized: false,
  field: { name: "slug", type: "text", localized: false, required: false, admin: {} },
  path: "slug",
  schemaPath: "slug",
} as unknown as SlugFieldProps;

const render = (isDisabled: boolean) => {
  disabled = isDisabled;
  hookCursor = 0;
  effects = [];
  SlugField(props);
  return effects;
};

test("does not apply a pending automatic slug after the field is disabled", async () => {
  const originalWindow = globalThis.window;
  globalThis.window = {
    setTimeout: (callback: () => void) => {
      scheduled = callback;
      return 1;
    },
    clearTimeout: () => undefined,
  } as unknown as Window & typeof globalThis;

  try {
    const initialEffects = render(false);
    const cleanups = initialEffects
      .map((effect) => effect())
      .filter((cleanup) => cleanup !== undefined);
    scheduled?.();
    const disabledEffects = render(true);
    for (const cleanup of cleanups) cleanup?.();
    for (const effect of disabledEffects) effect();
    resolveSlug?.("late-slug");
    await Promise.resolve();

    expect(resolveSlug).toBeDefined();
    expect(slugUpdates).toEqual([]);
  } finally {
    globalThis.window = originalWindow;
    disabled = false;
    slugValue = "";
    slugUpdates.length = 0;
    scheduled = undefined;
    resolveSlug = undefined;
    refs.length = 0;
    hookCursor = 0;
    effects = [];
  }
});
