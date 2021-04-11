import { compareObjectValues } from "./compareObjectValues";

describe("comparePrimitiveValues", () => {
  it("should compare numbers correctly", () => {
    expect.assertions(1);

    const values = [{ value: 1 }, { value: 4 }, { value: 3 }, { value: 2 }, { value: 2 }];
    const sortedValues = values.sort((a, b) => compareObjectValues({ a, b, field: "value" }));

    expect(sortedValues).toStrictEqual([{ value: 1 }, { value: 2 }, { value: 2 }, { value: 3 }, { value: 4 }]);
  });
  it("should compare strings correctly", () => {
    expect.assertions(1);

    const values = [{ value: "1" }, { value: "4" }, { value: "3" }, { value: "2" }, { value: "2" }];
    const sortedValues = values.sort((a, b) => compareObjectValues({ a, b, field: "value" }));

    expect(sortedValues).toStrictEqual([
      { value: "1" },
      { value: "2" },
      { value: "2" },
      { value: "3" },
      { value: "4" },
    ]);
  });
});
