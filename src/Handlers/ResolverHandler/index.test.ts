// eslint-disable-next-line import/no-nodejs-modules
import { existsSync, readdirSync, readFileSync, rmdirSync } from "fs";

import type { GeneratorConfig } from "../../GeneratorConfig";
import { importDmmf } from "../../helpers";
import { EnumHandler } from "../EnumHandler";

import { ResolverHandler } from ".";

describe("ResolverHandler", () => {
  // eslint-disable-next-line jest/no-hooks
  beforeAll(async () => {
    if (existsSync(`${process.cwd()}/fixtures/resolverTypeHandler/fixtures/`)) {
      rmdirSync(`${process.cwd()}/fixtures/resolverTypeHandler/fixtures/`, { recursive: true });
    }
  });

  it("should parse resolvers and create correct resolver files from datamodel", async () => {
    expect.assertions(12);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/resolverTypeHandler/fixtures/output2`,
      includePrismaSelect: false,
      inputArgumentsName: "",
      paths: {
        enums: "enums",
        inputTypes: "inputTypes",
        model: "model",
        outputTypes: "outputTypes",
        resolvers: "resolvers",
        shared: "shared",
      },
      prismaClientImportPath: `${process.cwd()}/node_modules/@prisma/client`,
      prismaServiceImport: "PrismaService",
      prismaServiceImportPath: "@PrismaService",
    };

    const enumHandler = new EnumHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    const resolverTypeHandler = new ResolverHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    enumHandler.parse();

    resolverTypeHandler.parse(enumHandler.getEnums());
    await resolverTypeHandler.createFiles();

    const userResolverFiles = readdirSync(`${config.basePath}/User/${config.paths.resolvers}`);

    userResolverFiles.forEach((resolver) => {
      const userResolverFile = readFileSync(`${config.basePath}/User/${config.paths.resolvers}/${resolver}`, "utf-8");

      // eslint-disable-next-line jest/prefer-inline-snapshots
      expect(userResolverFile).toMatchSnapshot();
    });
    // eslint-disable-next-line jest/prefer-inline-snapshots
    expect(userResolverFiles).toMatchSnapshot();
  });

  it("should create correct barrel files", async () => {
    expect.assertions(2);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/resolverTypeHandler/fixtures/output3`,
      includePrismaSelect: false,
      inputArgumentsName: "",
      paths: {
        enums: "enums",
        inputTypes: "inputTypes",
        model: "model",
        outputTypes: "outputTypes",
        resolvers: "resolvers",
        shared: "shared",
      },
      prismaClientImportPath: `${process.cwd()}/node_modules/@prisma/client`,
      prismaServiceImport: "PrismaService",
      prismaServiceImportPath: "@PrismaService",
    };

    const resolverTypeHandler = new ResolverHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    resolverTypeHandler.parse([]);
    await Promise.all([resolverTypeHandler.createBarrelFiles(), resolverTypeHandler.createFiles()]);

    const userResolverIndexFile = readFileSync(`${config.basePath}/User/${config.paths.resolvers}/index.ts`, "utf-8");
    const userResolverFiles = readdirSync(`${config.basePath}/User/${config.paths.resolvers}`);

    const lines = userResolverIndexFile
      .toString()
      .split("\n")
      .filter((line) => line.length).length;

    expect(lines).toBe(userResolverFiles.length - 1);
    expect(userResolverIndexFile).toMatchInlineSnapshot(`
      "export { AggregateUserResolver } from \\"./AggregateUserResolver\\";
      export { CreateManyUserResolver } from \\"./CreateManyUserResolver\\";
      export { CreateOneUserResolver } from \\"./CreateOneUserResolver\\";
      export { DeleteManyUserResolver } from \\"./DeleteManyUserResolver\\";
      export { DeleteOneUserResolver } from \\"./DeleteOneUserResolver\\";
      export { FindFirstUserResolver } from \\"./FindFirstUserResolver\\";
      export { FindManyUserResolver } from \\"./FindManyUserResolver\\";
      export { FindUniqueUserResolver } from \\"./FindUniqueUserResolver\\";
      export { UpdateManyUserResolver } from \\"./UpdateManyUserResolver\\";
      export { UpdateOneUserResolver } from \\"./UpdateOneUserResolver\\";
      export { UpsertOneUserResolver } from \\"./UpsertOneUserResolver\\";
      "
    `);
  });
});
