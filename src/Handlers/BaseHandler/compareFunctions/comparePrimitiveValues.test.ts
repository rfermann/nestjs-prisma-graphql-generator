import { comparePrimitiveValues } from "./comparePrimitiveValues";

describe("comparePrimitiveValues", () => {
  it("should compare numbers correctly", () => {
    expect.assertions(1);

    const values = [1, 4, 3, 2, 2];
    const sortedValues = values.sort(comparePrimitiveValues);

    expect(sortedValues).toStrictEqual([1, 2, 2, 3, 4]);
  });
  it("should compare strings correctly", () => {
    expect.assertions(1);

    const values = ["1", "4", "3", "2", "2"];
    const sortedValues = values.sort(comparePrimitiveValues);

    expect(sortedValues).toStrictEqual(["1", "2", "2", "3", "4"]);
  });
});
