import type { GeneratorOptions } from "@prisma/generator-helper";

import { Generator } from "./Generator";

export const generate = async (options: GeneratorOptions): Promise<void> => {
  const generator = new Generator(options);

  await generator.generate();
};
