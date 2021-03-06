// eslint-disable-next-line import/no-nodejs-modules
import { readdirSync } from "fs";

import type { GeneratorConfig } from "@prisma/generator-helper";

import { importDmmf } from "../helpers";

import { Generator } from ".";

const getStartedMessage = (message: string) => `${message} [started]`;
const getCompletedMessage = (message: string) => `${message} [completed]`;

const findStartedMessage = (values: string[], message: string) =>
  values.filter((x: string) => x.includes(getStartedMessage(message)));

const findCompletedMessage = (values: string[], message: string) =>
  values.filter((x: string) => x.includes(getCompletedMessage(message)));

const generatorConfig: GeneratorConfig = {
  binaryTargets: [],
  config: {
    prismaServiceImportPath: "nestjs-prisma",
  },
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

describe("Generator", () => {
  it("should create the correct files", async () => {
    expect.assertions(1);

    const generator = new Generator({
      datamodel: "",
      datasources: [],
      dmmf: importDmmf(prismaGenerator.output?.value as string),
      generator: {
        ...generatorConfig,
        output: {
          fromEnvVar: null,
          value: `${process.cwd()}/fixtures/Generator/output1`,
        },
      },
      otherGenerators: [{ ...prismaGenerator }],
      schemaPath: "",
      version: "",
    });

    // only to suppress console.log
    const consoleLog = jest.spyOn(global.console, "log").mockImplementation();

    await generator.generate();
    consoleLog.mockRestore();

    const folderList = readdirSync(`${process.cwd()}/fixtures/Generator/output1`).sort((a, b) => {
      if (a.toLowerCase() > b.toLowerCase()) {
        return 1;
      }

      if (a.toLowerCase() < b.toLowerCase()) {
        return -1;
      }

      return 0;
    });

    expect([...folderList]).toStrictEqual(["enums", "index.ts", "Session", "shared", "User"]);
  });
  it("should log the correct actions", async () => {
    expect.assertions(42);

    const generator = new Generator({
      datamodel: "",
      datasources: [],
      // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore will be defined later
      dmmf: null,
      generator: {
        ...generatorConfig,
        config: {
          ...generatorConfig.config,
          inputTypeDecoratorsPath: `${process.cwd()}/fixtures/Generator/output1/inputTypeDecorators`,
        },
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

    expect(values).toHaveLength(42);

    // expect starting and closing messages to appear in the correct order
    expect(values[0]).toMatch(getStartedMessage(Generator.messages.init));
    expect(values[1]).toMatch(getCompletedMessage(Generator.messages.init));
    expect(values[values.length - 1]).toMatch(getCompletedMessage(Generator.messages.title));

    // expect messages to appear (correct order can't be predicted due to async nature of some tasks)
    expect(findStartedMessage(values, Generator.messages.objects)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.objects)).toHaveLength(1);

    expect(findStartedMessage(values, Generator.messages.enums.title)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.enums.title)).toHaveLength(1);
    expect(findStartedMessage(values, Generator.messages.enums.parse)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.enums.parse)).toHaveLength(1);
    expect(findStartedMessage(values, Generator.messages.enums.generate)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.enums.generate)).toHaveLength(1);

    expect(findStartedMessage(values, Generator.messages.models.title)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.models.title)).toHaveLength(1);
    expect(findStartedMessage(values, Generator.messages.models.parse)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.models.parse)).toHaveLength(1);
    expect(findStartedMessage(values, Generator.messages.models.generate)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.models.generate)).toHaveLength(1);

    expect(findStartedMessage(values, Generator.messages.inputTypes.title)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.inputTypes.title)).toHaveLength(1);
    expect(findStartedMessage(values, Generator.messages.inputTypes.parse)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.inputTypes.parse)).toHaveLength(1);
    expect(findStartedMessage(values, Generator.messages.inputTypes.generate)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.inputTypes.generate)).toHaveLength(1);

    expect(findStartedMessage(values, Generator.messages.outputTypes.title)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.outputTypes.title)).toHaveLength(1);
    expect(findStartedMessage(values, Generator.messages.outputTypes.parse)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.outputTypes.parse)).toHaveLength(1);
    expect(findStartedMessage(values, Generator.messages.outputTypes.generate)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.outputTypes.generate)).toHaveLength(1);

    expect(findStartedMessage(values, Generator.messages.resolvers.title)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.resolvers.title)).toHaveLength(1);
    expect(findStartedMessage(values, Generator.messages.resolvers.parse)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.resolvers.parse)).toHaveLength(1);
    expect(findStartedMessage(values, Generator.messages.resolvers.generate)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.resolvers.generate)).toHaveLength(1);

    expect(findStartedMessage(values, Generator.messages.inputTypeDecorators.title)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.inputTypeDecorators.title)).toHaveLength(1);
    expect(findStartedMessage(values, Generator.messages.inputTypeDecorators.parse)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.inputTypeDecorators.parse)).toHaveLength(1);
    expect(findStartedMessage(values, Generator.messages.inputTypeDecorators.generate)).toHaveLength(1);
    expect(findCompletedMessage(values, Generator.messages.inputTypeDecorators.generate)).toHaveLength(1);
  });
});
