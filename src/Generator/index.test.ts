// eslint-disable-next-line import/no-nodejs-modules
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "fs";

import type { GeneratorConfig } from "@prisma/generator-helper";

import { Generator } from ".";

const getStartedMessage = (message: string) => `${message} [started]`;
const getCompletedMessage = (message: string) => `${message} [completed]`;

const findStartedMessage = (values: string[], message: string) =>
  values.filter((x: string) => x.includes(getStartedMessage(message)));

const findCompletedMessage = (values: string[], message: string) =>
  values.filter((x: string) => x.includes(getCompletedMessage(message)));

const generatorConfig: GeneratorConfig = {
  binaryTargets: [],
  config: {},
  name: "client",
  output: {
    fromEnvVar: null,
    value: `${process.cwd()}/fixtures/Generator/output`,
  },
  previewFeatures: [],
  provider: { fromEnvVar: null, value: "prisma-client-js" },
};

const prismaGenerator: GeneratorConfig = {
  binaryTargets: [],
  config: {},
  name: "client",
  output: {
    fromEnvVar: null,
    value: `${process.cwd()}/node_modules/@prisma/client`,
  },
  previewFeatures: [],
  provider: { fromEnvVar: null, value: "prisma-client-js" },
};

// eslint-disable-next-line max-lines-per-function
describe("Generator", () => {
  // eslint-disable-next-line jest/no-hooks
  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (!existsSync(generatorConfig.output!.value)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      mkdirSync(generatorConfig.output!.value, { recursive: true });
    }
  });

  it("should clear the output folder", async () => {
    expect.assertions(3);

    const generator = new Generator({
      datamodel: "",
      datasources: [],
      // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore will be defined later
      dmmf: null,
      generator: generatorConfig,
      otherGenerators: [{ ...prismaGenerator }],
      schemaPath: "",
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    writeFileSync(`${generatorConfig.output!.value}/dummy.json`, "null", "utf8");

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let fileExists = existsSync(`${generatorConfig.output!.value}/dummy.json`);

    expect(fileExists).toBe(true);
    await generator.initOutputFolder();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const folderExists = existsSync(generatorConfig.output!.value);

    fileExists = existsSync(`${process.cwd()}/fixtures/Generator/output/dummy.json`);

    expect(fileExists).toBe(false);
    expect(folderExists).toBe(true);
  });

  it("should create the correct files", async () => {
    expect.assertions(1);

    const generator = new Generator({
      datamodel: "",
      datasources: [],
      // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore will be defined later
      dmmf: null,
      generator: {
        ...generatorConfig,
        output: {
          fromEnvVar: null,
          value: `${process.cwd()}/fixtures/Generator/output1`,
        },
      },
      otherGenerators: [{ ...prismaGenerator }],
      schemaPath: "",
    });

    // only to suppress console.log
    const consoleLog = jest.spyOn(global.console, "log").mockImplementation();

    await generator.generate();
    consoleLog.mockRestore();

    const folderList = readdirSync(`${process.cwd()}/fixtures/Generator/output1`);

    expect([...folderList]).toStrictEqual(["enums"]);
  });
  it("should log the correct actions", async () => {
    expect.assertions(9);

    const generator = new Generator({
      datamodel: "",
      datasources: [],
      // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore will be defined later
      dmmf: null,
      generator: {
        ...generatorConfig,
        output: {
          fromEnvVar: null,
          value: `${process.cwd()}/fixtures/Generator/output1`,
        },
      },
      otherGenerators: [{ ...prismaGenerator }],
      schemaPath: "",
    });

    const consoleLog = jest.spyOn(global.console, "log").mockImplementation();

    await generator.generate();

    const values = consoleLog.mock.calls.flat();

    consoleLog.mockRestore();

    // expect starting and closing messages to appear in the correct order
    expect(values[0]).toMatch(getStartedMessage(Generator.messages.init));
    expect(values[1]).toMatch(getCompletedMessage(Generator.messages.init));
    expect(values[values.length - 1]).toMatch(getCompletedMessage(Generator.messages.title));

    // expect messages to appear (correct order can't be predicted due to async nature of some tasks)
    expect(findStartedMessage(values, Generator.messages.enums.title)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.enums.title)).toHaveLength(1);

    expect(findStartedMessage(values, Generator.messages.enums.parse)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.enums.parse)).toHaveLength(1);
    expect(findStartedMessage(values, Generator.messages.enums.generate)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.enums.generate)).toHaveLength(1);
  });
});
