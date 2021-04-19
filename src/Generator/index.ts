// eslint-disable-next-line import/no-nodejs-modules
import { mkdirSync, rmdirSync } from "fs";

import type { DMMF, GeneratorOptions } from "@prisma/generator-helper";
import Listr from "listr";

import { GeneratorConfig } from "../GeneratorConfig";
import { EnumHandler } from "../Handlers/EnumHandler";
import { InputTypeHandler } from "../Handlers/InputTypeHandler";
import { ModelHandler } from "../Handlers/ModelHandler";
import { OutputTypeHandler } from "../Handlers/OutputTypeHandler";
import { importDmmf } from "../helpers";

export class Generator {
  static messages = {
    enums: {
      generate: "Generating Enums",
      parse: "Parsing Enums",
      title: "Parsing and generating Enums",
    },
    init: "Initialize generator",
    inputTypes: {
      generate: "Generating Input Types",
      parse: "Parsing Input Types",
      title: "Parsing and generating Input Types",
    },
    models: {
      generate: "Generating Models",
      parse: "Parsing Models",
      title: "Parsing and generating Models",
    },
    objects: "Processing Models, Object Types and Resolvers",
    outputTypes: {
      generate: "Generating Output Types",
      parse: "Parsing Output Types",
      title: "Parsing and generating Output Types",
    },
    title: "Generating NestJS integration",
  };

  private readonly _config: GeneratorConfig;

  private _dmmf!: DMMF.Document;

  private _enumHandler!: EnumHandler;

  private _inputTypeHandler!: InputTypeHandler;

  private _modelHandler!: ModelHandler;

  private _outputTypeHandler!: OutputTypeHandler;

  constructor({ generator, otherGenerators }: GeneratorOptions) {
    this._config = new GeneratorConfig({ generator, otherGenerators });
  }

  // eslint-disable-next-line max-lines-per-function
  async generate(): Promise<void> {
    const tasks = new Listr(
      [
        {
          task: async () => this._init(),
          title: Generator.messages.init,
        },
        {
          // eslint-disable-next-line max-lines-per-function
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
                {
                  // eslint-disable-next-line max-lines-per-function
                  task: async () =>
                    new Listr(
                      [
                        {
                          task: async () =>
                            new Listr([
                              {
                                task: () => this._modelHandler.parse(this._enumHandler.getEnums()),
                                title: Generator.messages.models.parse,
                              },
                              {
                                task: async () => {
                                  await this._modelHandler.createFiles();
                                },
                                title: Generator.messages.models.generate,
                              },
                            ]),
                          title: Generator.messages.models.title,
                        },
                        {
                          task: async () =>
                            new Listr([
                              {
                                task: () => this._inputTypeHandler.parse(this._enumHandler.getEnums()),
                                title: Generator.messages.inputTypes.parse,
                              },
                              {
                                task: async () => {
                                  await this._inputTypeHandler.createFiles();
                                },
                                title: Generator.messages.inputTypes.generate,
                              },
                            ]),
                          title: Generator.messages.inputTypes.title,
                        },
                        {
                          task: async () =>
                            new Listr([
                              {
                                task: () => this._outputTypeHandler.parse(this._enumHandler.getEnums()),
                                title: Generator.messages.outputTypes.parse,
                              },
                              {
                                task: async () => {
                                  await this._outputTypeHandler.createFiles();
                                },
                                title: Generator.messages.outputTypes.generate,
                              },
                            ]),
                          title: Generator.messages.outputTypes.title,
                        },
                      ],
                      { concurrent: true }
                    ),
                  title: Generator.messages.objects,
                },
              ],
              { concurrent: false }
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

  private async _init(): Promise<void> {
    // dmmf needs to be imported from prisma client. content differs from the dmmf passed in the generator options
    this._dmmf = importDmmf(this._config.prismaClientImportPath);

    this._enumHandler = new EnumHandler({ config: this._config, dmmf: this._dmmf });
    this._modelHandler = new ModelHandler({ config: this._config, dmmf: this._dmmf });
    this._inputTypeHandler = new InputTypeHandler({ config: this._config, dmmf: this._dmmf });
    this._outputTypeHandler = new OutputTypeHandler({ config: this._config, dmmf: this._dmmf });

    await this._initOutputFolder();
  }

  private async _initOutputFolder(): Promise<void> {
    rmdirSync(this._config.basePath, { recursive: true });
    mkdirSync(this._config.basePath, { recursive: true });
  }
}
