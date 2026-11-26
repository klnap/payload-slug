export const slugModePathFromSlugPath = (slugPath: string): string => {
  const lastDot = slugPath.lastIndexOf(".");
  if (lastDot === -1) {
    return "slugMode";
  }
  return `${slugPath.slice(0, lastDot + 1)}slugMode`;
};
