import type { Field } from "payload";

const LAYOUT_ADMIN_KEYS = new Set(["position", "width"]);

export const collectFields = (field: Field): Field[] => {
  const result: Field[] = [field];

  if (field.type === "row" || field.type === "group" || field.type === "collapsible") {
    for (const child of field.fields) {
      result.push(...collectFields(child));
    }
  }

  if (field.type === "tabs") {
    for (const tab of field.tabs) {
      for (const child of tab.fields) {
        result.push(...collectFields(child));
      }
    }
  }

  if (field.type === "array" && "fields" in field) {
    for (const child of field.fields) {
      result.push(...collectFields(child));
    }
  }

  return result;
};

export const fieldHasForcedLayoutAdmin = (field: Field): boolean => {
  const admin = field.admin;
  if (!admin || typeof admin !== "object") return false;

  for (const key of LAYOUT_ADMIN_KEYS) {
    if (key in admin && (admin as Record<string, unknown>)[key] !== undefined) {
      return true;
    }
  }

  return false;
};

export const slugFieldOutputHasLayoutAdmin = (root: Field): boolean =>
  collectFields(root).some(fieldHasForcedLayoutAdmin);
