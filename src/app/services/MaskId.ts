export const maskId = (id?: string | null): string => {
  if (!id) return "-";
  return `...${id.slice(-4)}`;
};