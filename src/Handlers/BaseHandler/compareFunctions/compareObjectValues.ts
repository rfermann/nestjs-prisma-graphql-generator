interface CompareArrayOfObjects<T> {
  a: T;
  b: T;
  field: keyof T;
}

export const compareObjectValues = <T>({ a, b, field }: CompareArrayOfObjects<T>): number => {
  if (a[field] > b[field]) {
    return 1;
  }

  if (a[field] < b[field]) {
    return -1;
  }

  return 0;
};
