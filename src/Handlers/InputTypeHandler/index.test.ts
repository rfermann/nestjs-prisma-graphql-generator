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
    expect.assertions(22);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/inputTypeHandler/fixtures/output2`,
      includePrismaSelect: false,
      inputArgumentsName: "input",
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

  it("should create correct barrel files for User input types", async () => {
    expect.assertions(2);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/inputTypeHandler/fixtures/output3`,
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

    const inputTypeHandler = new InputTypeHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    enumHandler.parse();

    inputTypeHandler.parse(enumHandler.getEnums());
    await Promise.all([inputTypeHandler.createBarrelFiles(), inputTypeHandler.createFiles()]);

    const userInputTypeIndexFile = readFileSync(`${config.basePath}/User/${config.paths.inputTypes}/index.ts`, "utf-8");
    const userInputFiles = readdirSync(`${config.basePath}/User/${config.paths.inputTypes}`);

    const lines = userInputTypeIndexFile
      .toString()
      .split("\n")
      .filter((line) => line.length).length;

    expect(lines).toBe(userInputFiles.length - 1);
    expect(userInputTypeIndexFile).toMatchInlineSnapshot(`
      "export { AggregateUser } from \\"./AggregateUser\\";
      export { CreateManyUser } from \\"./CreateManyUser\\";
      export { CreateOneUser } from \\"./CreateOneUser\\";
      export { DeleteManyUser } from \\"./DeleteManyUser\\";
      export { DeleteOneUser } from \\"./DeleteOneUser\\";
      export { FindFirstUser } from \\"./FindFirstUser\\";
      export { FindManyUser } from \\"./FindManyUser\\";
      export { FindUniqueUser } from \\"./FindUniqueUser\\";
      export { GroupByUser } from \\"./GroupByUser\\";
      export { UpdateManyUser } from \\"./UpdateManyUser\\";
      export { UpdateOneUser } from \\"./UpdateOneUser\\";
      export { UpsertOneUser } from \\"./UpsertOneUser\\";
      export { UserCreateInput } from \\"./UserCreateInput\\";
      export { UserCreateManyInput } from \\"./UserCreateManyInput\\";
      export { UserCreateNestedOneWithoutSessionInput } from \\"./UserCreateNestedOneWithoutSessionInput\\";
      export { UserCreateOrConnectWithoutSessionInput } from \\"./UserCreateOrConnectWithoutSessionInput\\";
      export { UserCreateWithoutSessionInput } from \\"./UserCreateWithoutSessionInput\\";
      export { UserOrderByInput } from \\"./UserOrderByInput\\";
      export { UserRelationFilter } from \\"./UserRelationFilter\\";
      export { UserScalarWhereWithAggregatesInput } from \\"./UserScalarWhereWithAggregatesInput\\";
      export { UserUpdateInput } from \\"./UserUpdateInput\\";
      export { UserUpdateManyMutationInput } from \\"./UserUpdateManyMutationInput\\";
      export { UserUpdateOneRequiredWithoutSessionInput } from \\"./UserUpdateOneRequiredWithoutSessionInput\\";
      export { UserUpdateWithoutSessionInput } from \\"./UserUpdateWithoutSessionInput\\";
      export { UserUpsertWithoutSessionInput } from \\"./UserUpsertWithoutSessionInput\\";
      export { UserWhereInput } from \\"./UserWhereInput\\";
      export { UserWhereUniqueInput } from \\"./UserWhereUniqueInput\\";
      "
    `);
  });

  it("should create correct barrel files for shared input types", async () => {
    expect.assertions(2);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/inputTypeHandler/fixtures/output4`,
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

    const inputTypeHandler = new InputTypeHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    enumHandler.parse();

    inputTypeHandler.parse(enumHandler.getEnums());
    await Promise.all([inputTypeHandler.createBarrelFiles(), inputTypeHandler.createFiles()]);

    const sharedInputTypeIndexFile = readFileSync(
      `${config.basePath}/shared/${config.paths.inputTypes}/index.ts`,
      "utf-8"
    );

    const sharedInputFiles = readdirSync(`${config.basePath}/shared/${config.paths.inputTypes}`);

    const lines = sharedInputTypeIndexFile
      .toString()
      .split("\n")
      .filter((line) => line.length).length;

    expect(lines).toBe(sharedInputFiles.length - 1);
    // eslint-disable-next-line jest/prefer-inline-snapshots
    expect(sharedInputTypeIndexFile).toMatchSnapshot();
  });
});
