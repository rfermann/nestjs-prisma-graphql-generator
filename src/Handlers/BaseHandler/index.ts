import type { DMMF } from "@prisma/generator-helper";

import type { GeneratorConfig } from "../../GeneratorConfig";

import { BaseFileGenerator } from "./BaseFileGenerator";
import { BaseParser } from "./BaseParser";

interface HandlerOptions {
  config: GeneratorConfig;
  dmmf: DMMF.Document;
}

export abstract class BaseHandler {
  protected readonly baseFileGenerator: BaseFileGenerator;

  protected readonly baseParser: BaseParser;

  protected readonly config: GeneratorConfig;

  constructor({ config, dmmf }: HandlerOptions) {
    this.config = config;
    this.baseParser = new BaseParser(config, dmmf);
    this.baseFileGenerator = new BaseFileGenerator(this.baseParser, config);
  }
}
