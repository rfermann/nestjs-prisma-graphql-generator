// eslint-disable-next-line import/no-nodejs-modules
import { mkdirSync, rmdirSync } from "fs";

import type { DMMF, GeneratorOptions } from "@prisma/generator-helper";
import Listr from "listr";

import { GeneratorConfig } from "../GeneratorConfig";
import { EnumHandler } from "../Handlers/EnumHandler";

export class Generator {
  static messages = {
    enums: {
      generate: "Generating Enums",
      parse: "Parsing Enums",
      title: "Parsing and generating Enums",
    },
    init: "Initialize generator",
    title: "Generating NestJS integration",
  };

  private readonly _config: GeneratorConfig;

  private _dmmf!: DMMF.Document;

  private _enumHandler!: EnumHandler;

  constructor({ generator, otherGenerators }: GeneratorOptions) {
    this._config = new GeneratorConfig({ generator, otherGenerators });
  }

  async generate(): Promise<void> {
    const tasks = new Listr(
      [
        {
          task: async () => this._init(),
          title: Generator.messages.init,
        },
        {
          task: () =>
            new Listr(
              [
                {
                  task: async () =>
                    new Listr([
                      {
                        task: () => this._enumHandler.parse(),
                        title: Generator.messages.enums.parse,
                      },
                      {
                        task: async () => {
                          await this._enumHandler.createBarrelFile();
                          await this._enumHandler.createFiles();
                        },
                        title: Generator.messages.enums.generate,
                      },
                    ]),
                  title: Generator.messages.enums.title,
                },
              ],
              { concurrent: true }
            ),
          title: Generator.messages.title,
        },
      ],
      {
        collapse: false,
        concurrent: false,
      }
    );

    await tasks.run();
  }

  async initOutputFolder(): Promise<void> {
    rmdirSync(this._config.basePath, { recursive: true });
    mkdirSync(this._config.basePath, { recursive: true });
  }

  private async _init(): Promise<void> {
    // dmmf needs to be imported from prisma client. content differs from the dmmf passed in the generator options
    // eslint-disable-next-line max-len
    // eslint-disable-next-line global-require, import/no-dynamic-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    this._dmmf = require(this._config.prismaClientImportPath).dmmf as DMMF.Document;

    this._enumHandler = new EnumHandler({ config: this._config, dmmf: this._dmmf });

    await this.initOutputFolder();
  }
}
