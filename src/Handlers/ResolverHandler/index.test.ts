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
      prismaServiceImport: "",
      prismaServiceImportPath: "",
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
});
