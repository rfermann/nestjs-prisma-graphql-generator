// eslint-disable-next-line import/no-nodejs-modules
import { existsSync, readdirSync, readFileSync, rmdirSync } from "fs";

import type { GeneratorConfig } from "../../GeneratorConfig";
import { importDmmf } from "../../helpers";
import { EnumHandler } from "../EnumHandler";

import { InputTypeHandler } from ".";

describe("InputTypeHandler", () => {
  // eslint-disable-next-line jest/no-hooks
  beforeAll(async () => {
    if (existsSync(`${process.cwd()}/fixtures/inputTypeHandler/fixtures/`)) {
      rmdirSync(`${process.cwd()}/fixtures/inputTypeHandler/fixtures/`, { recursive: true });
    }
  });
  it("should parse DMMF properly", async () => {
    expect.assertions(1);

    expect(true).toBe(true);
  });

  it("should parse input types and create correct shared files from datamodel", async () => {
    expect.assertions(55);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/inputTypeHandler/fixtures/output1`,
      paths: {
        enums: "enums",
        inputTypes: "inputTypes",
        model: "model",
        shared: "shared",
      },
      prismaClientImportPath: `${process.cwd()}/node_modules/@prisma/client`,
    };

    const enumHandler = new EnumHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    const inputTypeHandler = new InputTypeHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    enumHandler.parse();

    inputTypeHandler.parse(enumHandler.getEnums());
    await inputTypeHandler.createFiles();

    const sharedInputFiles = readdirSync(`${config.basePath}/${config.paths.shared}/${config.paths.inputTypes}`);

    sharedInputFiles.forEach((inputType) => {
      const sharedInputFile = readFileSync(
        `${config.basePath}/${config.paths.shared}/${config.paths.inputTypes}/${inputType}`,
        "utf-8"
      );

      // eslint-disable-next-line jest/prefer-inline-snapshots
      expect(sharedInputFile).toMatchSnapshot();
    });
    // eslint-disable-next-line jest/prefer-inline-snapshots
    expect(sharedInputFiles).toMatchSnapshot();
  });

  it("should parse input types and create correct user input files from datamodel", async () => {
    expect.assertions(16);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/inputTypeHandler/fixtures/output2`,
      paths: {
        enums: "enums",
        inputTypes: "inputTypes",
        model: "model",
        shared: "shared",
      },
      prismaClientImportPath: `${process.cwd()}/node_modules/@prisma/client`,
    };

    const enumHandler = new EnumHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    const inputTypeHandler = new InputTypeHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    enumHandler.parse();

    inputTypeHandler.parse(enumHandler.getEnums());
    await inputTypeHandler.createFiles();

    const userInputFiles = readdirSync(`${config.basePath}/User/${config.paths.inputTypes}`);

    userInputFiles.forEach((inputType) => {
      const userInputFile = readFileSync(`${config.basePath}/User/${config.paths.inputTypes}/${inputType}`, "utf-8");

      // eslint-disable-next-line jest/prefer-inline-snapshots
      expect(userInputFile).toMatchSnapshot();
    });
    // eslint-disable-next-line jest/prefer-inline-snapshots
    expect(userInputFiles).toMatchSnapshot();
  });
});
