import type { GeneratorConfig as PrismaGeneratorConfig } from "@prisma/generator-helper";

interface Paths {
  enums: string;
  inputTypes: string;
  model: string;
  outputTypes: string;
  resolvers: string;
  shared: string;
}

interface GeneratorOptions {
  generator: PrismaGeneratorConfig;
  otherGenerators: PrismaGeneratorConfig[];
}

export class GeneratorConfig {
  readonly basePath: string;

  readonly includePrismaSelect: boolean;

  readonly inputArgumentsName: string;

  readonly paths: Paths;

  readonly prismaClientImportPath: string;

  readonly prismaServiceImport: string;

  readonly prismaServiceImportPath: string;

  constructor({ generator: { config, output }, otherGenerators }: GeneratorOptions) {
    if (output === null) {
      throw new Error("Please define an output directory");
    }

    const prismaClientPath = otherGenerators.find((generator) => generator.provider.value === "prisma-client-js");

    if (typeof prismaClientPath === "undefined" || prismaClientPath.output === null) {
      throw new Error("Cannot detect prisma client. Please make sure to generate `prisma-client-js` first");
    }

    if (!config.prismaServiceImportPath || config.prismaServiceImportPath.length < 1) {
      throw new Error("Cannot detect prisma service. Please make sure to provide a path to your prisma service");
    }

    this.basePath = output.value;
    this.paths = {
      enums: "enums",
      inputTypes: "inputTypes",
      model: "model",
      outputTypes: "outputTypes",
      resolvers: "resolvers",
      shared: "shared",
    };
    this.includePrismaSelect = config.includePrismaSelect === "true" || false;
    this.inputArgumentsName = config.inputArgumentsName || "input";
    this.prismaClientImportPath = prismaClientPath.output.value;
    this.prismaServiceImport = config.prismaServiceImport || "PrismaService";
    this.prismaServiceImportPath = config.prismaServiceImportPath;
  }
}
