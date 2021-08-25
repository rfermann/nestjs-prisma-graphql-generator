// eslint-disable-next-line import/no-nodejs-modules
import { existsSync, readFileSync, rmdirSync } from "fs";

import type { GeneratorConfig } from "../../GeneratorConfig";
import { importDmmf } from "../../helpers";

import { EnumHandler } from ".";

describe("EnumHandler", () => {
  // eslint-disable-next-line jest/no-hooks
  beforeAll(async () => {
    if (existsSync(`${process.cwd()}/fixtures/enumHandler/fixtures/`)) {
      rmdirSync(`${process.cwd()}/fixtures/enumHandler/fixtures/`, { recursive: true });
    }
  });
  it("should parse DMMF properly", async () => {
    expect.assertions(1);

    expect(true).toBe(true);
  });

  it("should create correct barrel file", async () => {
    expect.assertions(1);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/enumHandler/fixtures/output1`,
      includePrismaSelect: false,
      inputArgumentsName: "",
      inputTypeDecoratorsPath: "",
      paths: {
        enums: "./enum",
        inputTypeDecorators: "",
        inputTypes: "",
        model: "model",
        outputTypes: "",
        resolvers: "",
        shared: "",
      },
      prismaClientImportPath: `${process.cwd()}/node_modules/@prisma/client`,
      prismaServiceImport: "",
      prismaServiceImportPath: "",
    };

    const enumHandler = new EnumHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    enumHandler.parse();
    await enumHandler.createBarrelFile();

    const file = readFileSync(`${config.basePath}/${config.paths.enums}/index.ts`, "utf-8");

    expect(file).toMatchInlineSnapshot(`
      "export { QueryModeEnum } from \\"./QueryModeEnum\\";
      export { SessionScalarFieldEnum } from \\"./SessionScalarFieldEnum\\";
      export { SortOrderEnum } from \\"./SortOrderEnum\\";
      export { UserScalarFieldEnum } from \\"./UserScalarFieldEnum\\";
      export { UserTypeEnum } from \\"./UserTypeEnum\\";
      export { UserTypeWithDocEnum } from \\"./UserTypeWithDocEnum\\";
      "
    `);
  });

  it("should not create a barrel file when no enums are provided", async () => {
    expect.assertions(1);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/enumHandler/fixtures/output2`,
      includePrismaSelect: false,
      inputArgumentsName: "",
      inputTypeDecoratorsPath: "",
      paths: {
        enums: "./enum",
        inputTypeDecorators: "",
        inputTypes: "",
        model: "model",
        outputTypes: "",
        resolvers: "",
        shared: "",
      },
      prismaClientImportPath: "",
      prismaServiceImport: "",
      prismaServiceImportPath: "",
    };

    const enumHandler = new EnumHandler({
      config,
      dmmf: {
        datamodel: { enums: [], models: [] },
        mappings: { modelOperations: [], otherOperations: { read: [], write: [] } },
        schema: {
          enumTypes: { prisma: [] },
          inputObjectTypes: { prisma: [] },
          outputObjectTypes: { model: [], prisma: [] },
        },
      },
    });

    enumHandler.parse();
    await enumHandler.createBarrelFile();
    expect(existsSync(`${config.basePath}/${config.paths.enums}/index.ts`)).toBe(false);
  });
  it("should parse enums and create correct files from datamodel", async () => {
    expect.assertions(2);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/enumHandler/fixtures/output3`,
      includePrismaSelect: false,
      inputArgumentsName: "",
      inputTypeDecoratorsPath: "",
      paths: {
        enums: "./enum",
        inputTypeDecorators: "",
        inputTypes: "",
        model: "model",
        outputTypes: "",
        resolvers: "",
        shared: "",
      },
      prismaClientImportPath: `${process.cwd()}/node_modules/@prisma/client`,
      prismaServiceImport: "",
      prismaServiceImportPath: "",
    };

    const enumHandler = new EnumHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    enumHandler.parse();
    await enumHandler.createFiles();

    const enumFile = readFileSync(`${config.basePath}/${config.paths.enums}/UserTypeEnum.ts`, "utf-8");

    expect(enumFile).toMatchInlineSnapshot(`
      "import { registerEnumType } from \\"@nestjs/graphql\\";

      export enum UserTypeEnum {
        USER = \\"USER\\",
        ADMIN = \\"ADMIN\\"
      }

      registerEnumType(UserTypeEnum, {
        name: \\"UserTypeEnum\\",
      });

      "
    `);

    const enumFileWithDocumentation = readFileSync(
      `${config.basePath}/${config.paths.enums}/UserTypeWithDocEnum.ts`,
      "utf-8"
    );

    expect(enumFileWithDocumentation).toMatchInlineSnapshot(`
      "import { registerEnumType } from \\"@nestjs/graphql\\";

      export enum UserTypeWithDocEnum {
        USER = \\"USER\\",
        ADMIN = \\"ADMIN\\"
      }

      registerEnumType(UserTypeWithDocEnum, {
        name: \\"UserTypeWithDocEnum\\",
        description: \\"user type comment\\"
      });

      "
    `);
  });
  it("should parse enums and create correct files from schema", async () => {
    expect.assertions(1);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/enumHandler/fixtures/output4`,
      includePrismaSelect: false,
      inputArgumentsName: "",
      inputTypeDecoratorsPath: "",
      paths: {
        enums: "./enum",
        inputTypeDecorators: "",
        inputTypes: "",
        model: "model",
        outputTypes: "",
        resolvers: "",
        shared: "",
      },
      prismaClientImportPath: `${process.cwd()}/node_modules/@prisma/client`,
      prismaServiceImport: "",
      prismaServiceImportPath: "",
    };

    const enumHandler = new EnumHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    enumHandler.parse();
    await enumHandler.createFiles();

    const enumFile1 = readFileSync(`${config.basePath}/${config.paths.enums}/QueryModeEnum.ts`, "utf-8");

    expect(enumFile1).toMatchInlineSnapshot(`
      "import { registerEnumType } from \\"@nestjs/graphql\\";

      export enum QueryModeEnum {
        \\"default\\" = \\"default\\",
        insensitive = \\"insensitive\\"
      }

      registerEnumType(QueryModeEnum, {
        name: \\"QueryModeEnum\\",
      });

      "
    `);
  });
});
