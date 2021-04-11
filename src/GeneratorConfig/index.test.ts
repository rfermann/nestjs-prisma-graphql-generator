import type { GeneratorConfig as PrismaGeneratorConfig } from "@prisma/generator-helper";

import { GeneratorConfig } from ".";

const generatorConfig: PrismaGeneratorConfig = {
  binaryTargets: [],
  config: {},
  name: "client",
  output: {
    fromEnvVar: null,
    value: `/fixtures/output`,
  },
  previewFeatures: [],
  provider: { fromEnvVar: null, value: "prisma-client-js" },
};

const prismaGenerator: PrismaGeneratorConfig = {
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

describe("GeneratorConfig", () => {
  it("should throw on missing output directory", async () => {
    expect.assertions(1);

    expect(
      () =>
        new GeneratorConfig({
          generator: { ...generatorConfig, output: null },
          otherGenerators: [],
        })
    ).toThrow("Please define an output directory");
  });
  it("should throw on missing prisma client", async () => {
    expect.assertions(1);

    expect(
      () =>
        new GeneratorConfig({
          generator: generatorConfig,
          otherGenerators: [],
        })
    ).toThrow("Cannot detect prisma client. Please make sure to generate `prisma-client-js` first");
  });
  it("should have correct configuration", async () => {
    expect.assertions(1);

    const config = new GeneratorConfig({
      generator: generatorConfig,
      otherGenerators: [prismaGenerator],
    });

    expect(config).toMatchObject({
      basePath: "/fixtures/output",
      paths: {
        enum: "enums",
      },
      prismaClientImportPath: `${process.cwd()}/node_modules/@prisma/client`,
    });
  });
});
