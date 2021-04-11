export const comparePrimitiveValues = (a: number | string, b: number | string): number => {
  if (a > b) {
    return 1;
  }

  if (a < b) {
    return -1;
  }

  return 0;
};
