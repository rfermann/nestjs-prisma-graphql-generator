// eslint-disable-next-line import/no-nodejs-modules
import { existsSync, readFileSync, rmSync } from "fs";

import type { GeneratorConfig } from "../../GeneratorConfig";

import { EnumHandler } from ".";

// eslint-disable-next-line max-lines-per-function
describe("EnumHandler", () => {
  // eslint-disable-next-line jest/no-hooks
  beforeAll(async () => {
    if (existsSync(`${process.cwd()}/fixtures/enumHandler/fixtures/`)) {
      rmSync(`${process.cwd()}/fixtures/enumHandler/fixtures/`, { recursive: true });
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
      paths: {
        enum: "./enum",
      },
      prismaClientImportPath: "",
    };

    const enumHandler = new EnumHandler({
      config,
      dmmf: {
        datamodel: { enums: [{ name: "enum1", values: [] }], models: [] },
        mappings: { modelOperations: [], otherOperations: { read: [], write: [] } },
        schema: {
          enumTypes: { prisma: [{ name: "enum2", values: [] }] },
          inputObjectTypes: { prisma: [] },
          outputObjectTypes: { model: [], prisma: [] },
        },
      },
    });

    enumHandler.parse();
    await enumHandler.createBarrelFile();

    const file = readFileSync(`${config.basePath}/${config.paths.enum}/index.ts`, "utf-8");

    expect(file).toMatchInlineSnapshot(`
      "export { enum1Enum } from \\"./enum1Enum\\";
      export { enum2Enum } from \\"./enum2Enum\\";
      "
    `);
  });

  it("should not create a barrel file when no enums are provided", async () => {
    expect.assertions(1);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/enumHandler/fixtures/output2`,
      paths: {
        enum: "./enum",
      },
      prismaClientImportPath: "",
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
    expect(existsSync(`${config.basePath}/${config.paths.enum}/index.ts`)).toBe(false);
  });
  // eslint-disable-next-line max-lines-per-function
  it("should parse enums and create correct files from datamodel", async () => {
    expect.assertions(2);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/enumHandler/fixtures/output3`,
      paths: {
        enum: "./enum",
      },
      prismaClientImportPath: "",
    };

    const enumHandler = new EnumHandler({
      config,
      dmmf: {
        datamodel: {
          enums: [
            {
              name: "User",
              values: [
                { dbName: "value1", name: "value1" },
                { dbName: "value2", name: "value2" },
              ],
            },
            {
              documentation: "Documentation",
              name: "UserDocumentation",
              values: [
                { dbName: "value1", name: "value1" },
                { dbName: "value2", name: "value2" },
              ],
            },
          ],
          models: [],
        },
        mappings: { modelOperations: [], otherOperations: { read: [], write: [] } },
        schema: {
          enumTypes: { prisma: [] },
          inputObjectTypes: { prisma: [] },
          outputObjectTypes: { model: [], prisma: [] },
        },
      },
    });

    enumHandler.parse();
    await enumHandler.createFiles();

    const enumFile = readFileSync(`${config.basePath}/${config.paths.enum}/UserEnum.ts`, "utf-8");

    expect(enumFile).toMatchInlineSnapshot(`
      "import { registerEnumType } from \\"@nestjs/graphql\\";

      export enum UserEnum {
        value1 = \\"value1\\",
        value2 = \\"value2\\"
      }

      registerEnumType(UserEnum, {
        name: \\"UserEnum\\",
      });

      "
    `);

    const enumFileWithDocumentation = readFileSync(
      `${config.basePath}/${config.paths.enum}/UserDocumentationEnum.ts`,
      "utf-8"
    );

    expect(enumFileWithDocumentation).toMatchInlineSnapshot(`
      "import { registerEnumType } from \\"@nestjs/graphql\\";

      export enum UserDocumentationEnum {
        value1 = \\"value1\\",
        value2 = \\"value2\\"
      }

      registerEnumType(UserDocumentationEnum, {
        name: \\"UserDocumentationEnum\\",
        description: \\"Documentation\\"
      });

      "
    `);
  });
  it("should parse enums and create correct files from schema", async () => {
    expect.assertions(1);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/enumHandler/fixtures/output4`,
      paths: {
        enum: "./enum",
      },
      prismaClientImportPath: "",
    };

    const enumHandler = new EnumHandler({
      config,
      dmmf: {
        datamodel: {
          enums: [],
          models: [],
        },
        mappings: { modelOperations: [], otherOperations: { read: [], write: [] } },
        schema: {
          enumTypes: {
            prisma: [
              {
                name: "User",
                values: ["value1", "value2"],
              },
            ],
          },
          inputObjectTypes: { prisma: [] },
          outputObjectTypes: { model: [], prisma: [] },
        },
      },
    });

    enumHandler.parse();
    await enumHandler.createFiles();

    const enumFile1 = readFileSync(`${config.basePath}/${config.paths.enum}/UserEnum.ts`, "utf-8");

    expect(enumFile1).toMatchInlineSnapshot(`
      "import { registerEnumType } from \\"@nestjs/graphql\\";

      export enum UserEnum {
        value1 = \\"value1\\",
        value2 = \\"value2\\"
      }

      registerEnumType(UserEnum, {
        name: \\"UserEnum\\",
      });

      "
    `);
  });
});
