import type { GeneratorConfig as PrismaGeneratorConfig } from "@prisma/generator-helper";

interface Paths {
  enum: string;
}

interface GeneratorOptions {
  generator: PrismaGeneratorConfig;
  otherGenerators: PrismaGeneratorConfig[];
}

export class GeneratorConfig {
  readonly basePath: string;

  readonly paths: Paths;

  readonly prismaClientImportPath: string;

  constructor({ generator: { output }, otherGenerators }: GeneratorOptions) {
    if (output === null) {
      throw new Error("Please define an output directory");
    }

    const prismaClientPath = otherGenerators.find((generator) => generator.provider.value === "prisma-client-js");

    if (typeof prismaClientPath === "undefined" || prismaClientPath.output === null) {
      throw new Error("Cannot detect prisma client. Please make sure to generate `prisma-client-js` first");
    }

    this.basePath = output.value;
    this.paths = {
      enum: "enums",
    };
    this.prismaClientImportPath = prismaClientPath.output.value;
  }
}
