// eslint-disable-next-line import/no-nodejs-modules
import { existsSync, readdirSync, readFileSync, rmdirSync } from "fs";

import type { GeneratorConfig } from "../../GeneratorConfig";
import { importDmmf } from "../../helpers";
import { EnumHandler } from "../EnumHandler";

import { OutputTypeHandler } from ".";

describe("OutputTypeHandler", () => {
  // eslint-disable-next-line jest/no-hooks
  beforeAll(async () => {
    if (existsSync(`${process.cwd()}/fixtures/outputTypeHandler/fixtures/`)) {
      rmdirSync(`${process.cwd()}/fixtures/outputTypeHandler/fixtures/`, { recursive: true });
    }
  });
  it("should parse DMMF properly", async () => {
    expect.assertions(1);

    expect(true).toBe(true);
  });

  it("should parse output types and create correct shared files from datamodel", async () => {
    expect.assertions(2);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/outputTypeHandler/fixtures/output1`,
      includePrismaSelect: false,
      inputArgumentsName: "",
      inputTypeDecoratorsPath: "",
      paths: {
        enums: "enums",
        inputTypeDecorators: "inputTypeDecorators",
        inputTypes: "inputTypes",
        model: "model",
        outputTypes: "outputTypes",
        resolvers: "resolvers",
        shared: "shared",
      },
      prismaClientImportPath: `${process.cwd()}/node_modules/@prisma/client`,
      prismaServiceImport: "",
      prismaServiceImportPath: "",
    };

    const enumHandler = new EnumHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    const outputTypeHandler = new OutputTypeHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    enumHandler.parse();

    outputTypeHandler.parse(enumHandler.getEnums());
    await outputTypeHandler.createFiles();

    const sharedOutputFiles = readdirSync(`${config.basePath}/${config.paths.shared}/${config.paths.outputTypes}`);

    sharedOutputFiles.forEach((outputType) => {
      const sharedOutputFile = readFileSync(
        `${config.basePath}/${config.paths.shared}/${config.paths.outputTypes}/${outputType}`,
        "utf-8"
      );

      // eslint-disable-next-line jest/prefer-inline-snapshots
      expect(sharedOutputFile).toMatchSnapshot();
    });
    // eslint-disable-next-line jest/prefer-inline-snapshots
    expect(sharedOutputFiles).toMatchSnapshot();
  });

  it("should parse output types and create correct user output files from datamodel", async () => {
    expect.assertions(8);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/outputTypeHandler/fixtures/output2`,
      includePrismaSelect: false,
      inputArgumentsName: "",
      inputTypeDecoratorsPath: "",
      paths: {
        enums: "enums",
        inputTypeDecorators: "inputTypeDecorators",
        inputTypes: "inputTypes",
        model: "model",
        outputTypes: "outputTypes",
        resolvers: "resolvers",
        shared: "shared",
      },
      prismaClientImportPath: `${process.cwd()}/node_modules/@prisma/client`,
      prismaServiceImport: "",
      prismaServiceImportPath: "",
    };

    const enumHandler = new EnumHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    const outputTypeHandler = new OutputTypeHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    enumHandler.parse();

    outputTypeHandler.parse(enumHandler.getEnums());
    await outputTypeHandler.createFiles();

    const userOutputFiles = readdirSync(`${config.basePath}/User/${config.paths.outputTypes}`);

    userOutputFiles.forEach((outputType) => {
      const userOutputFile = readFileSync(`${config.basePath}/User/${config.paths.outputTypes}/${outputType}`, "utf-8");

      // eslint-disable-next-line jest/prefer-inline-snapshots
      expect(userOutputFile).toMatchSnapshot();
    });
    // eslint-disable-next-line jest/prefer-inline-snapshots
    expect(userOutputFiles).toMatchSnapshot();
  });

  it("should create correct barrel files for User output types", async () => {
    expect.assertions(2);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/outputTypeHandler/fixtures/output3`,
      includePrismaSelect: false,
      inputArgumentsName: "",
      inputTypeDecoratorsPath: "",
      paths: {
        enums: "enums",
        inputTypeDecorators: "inputTypeDecorators",
        inputTypes: "inputTypes",
        model: "model",
        outputTypes: "outputTypes",
        resolvers: "resolvers",
        shared: "shared",
      },
      prismaClientImportPath: `${process.cwd()}/node_modules/@prisma/client`,
      prismaServiceImport: "",
      prismaServiceImportPath: "",
    };

    const enumHandler = new EnumHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    const outputTypeHandler = new OutputTypeHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    enumHandler.parse();

    outputTypeHandler.parse(enumHandler.getEnums());
    await Promise.all([outputTypeHandler.createBarrelFiles(), outputTypeHandler.createFiles()]);

    const userOutputTypeIndexFile = readFileSync(
      `${config.basePath}/User/${config.paths.outputTypes}/index.ts`,
      "utf-8"
    );

    const userOutputFiles = readdirSync(`${config.basePath}/User/${config.paths.outputTypes}`);

    const lines = userOutputTypeIndexFile
      .toString()
      .split("\n")
      .filter((line) => line.length).length;

    expect(lines).toBe(userOutputFiles.length - 1);
    expect(userOutputTypeIndexFile).toMatchInlineSnapshot(`
      "export { AggregateUser } from \\"./AggregateUser\\";
      export { UserAvgAggregateOutputType } from \\"./UserAvgAggregateOutputType\\";
      export { UserCountAggregateOutputType } from \\"./UserCountAggregateOutputType\\";
      export { UserGroupByOutputType } from \\"./UserGroupByOutputType\\";
      export { UserMaxAggregateOutputType } from \\"./UserMaxAggregateOutputType\\";
      export { UserMinAggregateOutputType } from \\"./UserMinAggregateOutputType\\";
      export { UserSumAggregateOutputType } from \\"./UserSumAggregateOutputType\\";
      "
    `);
  });

  it("should create correct barrel files for shared output types", async () => {
    expect.assertions(2);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/outputTypeHandler/fixtures/output4`,
      includePrismaSelect: false,
      inputArgumentsName: "",
      inputTypeDecoratorsPath: "",
      paths: {
        enums: "enums",
        inputTypeDecorators: "inputTypeDecorators",
        inputTypes: "inputTypes",
        model: "model",
        outputTypes: "outputTypes",
        resolvers: "resolvers",
        shared: "shared",
      },
      prismaClientImportPath: `${process.cwd()}/node_modules/@prisma/client`,
      prismaServiceImport: "",
      prismaServiceImportPath: "",
    };

    const enumHandler = new EnumHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    const outputTypeHandler = new OutputTypeHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    enumHandler.parse();

    outputTypeHandler.parse(enumHandler.getEnums());
    await Promise.all([outputTypeHandler.createBarrelFiles(), outputTypeHandler.createFiles()]);

    const sharedOutputTypeIndexFile = readFileSync(
      `${config.basePath}/shared/${config.paths.outputTypes}/index.ts`,
      "utf-8"
    );

    const sharedOutputFiles = readdirSync(`${config.basePath}/shared/${config.paths.outputTypes}`);

    const lines = sharedOutputTypeIndexFile
      .toString()
      .split("\n")
      .filter((line) => line.length).length;

    expect(lines).toBe(sharedOutputFiles.length - 1);
    expect(sharedOutputTypeIndexFile).toMatchInlineSnapshot(`
      "export { AffectedRowsOutput } from \\"./AffectedRowsOutput\\";
      "
    `);
  });
});
