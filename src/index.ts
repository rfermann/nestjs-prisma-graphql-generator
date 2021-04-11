import { generatorHandler } from "@prisma/generator-helper";

import { generate } from "./generate";

generatorHandler({
  onGenerate: generate,
  onManifest: () => {
    return {
      defaultOutput: "./@generated/nestjs",
      prettyName: "NestJS integration",
      requiresGenerators: ["prisma-client-js"],
    };
  },
});
