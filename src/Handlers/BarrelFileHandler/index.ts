import type { ExportDeclarationStructure, OptionalKind } from "ts-morph";

import { BaseHandler } from "../BaseHandler";
import { compareObjectValues } from "../BaseHandler/compareFunctions";

// note: this class will only handle generic barrel files.
// barrel files for model specific files will be handled by the corresponding type handler
export class BarrelFileHandler extends BaseHandler {
  async createBarrelFiles(): Promise<void> {
    await Promise.all([
      this._createSharedBarrelFile(),
      this._createModelBarrelFiles(),
      this._createTopLevelBarrelFile(),
    ]);
  }

  private async _createModelBarrelFiles(): Promise<void> {
    const sourceFilesPromise: Promise<void>[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const model of this.baseParser.modelsList) {
      const sourceFile = this.baseFileGenerator.createSourceFile(`${model}/index`);

      sourceFile.addExportDeclarations([
        {
          moduleSpecifier: `./${this.config.paths.inputTypes}`,
        },
        {
          moduleSpecifier: `./${this.config.paths.model}`,
        },
        {
          moduleSpecifier: `./${this.config.paths.outputTypes}`,
        },
        {
          moduleSpecifier: `./${this.config.paths.resolvers}`,
        },
      ]);

      sourceFilesPromise.push(sourceFile.save());
    }

    await Promise.all(sourceFilesPromise);
  }

  private async _createSharedBarrelFile(): Promise<void> {
    const sourceFile = this.baseFileGenerator.createSourceFile("shared/index");

    sourceFile.addExportDeclarations([
      {
        moduleSpecifier: `./${this.config.paths.inputTypes}`,
      },
      {
        moduleSpecifier: `./${this.config.paths.outputTypes}`,
      },
    ]);

    await sourceFile.save();
  }

  private async _createTopLevelBarrelFile(): Promise<void> {
    const sourceFile = this.baseFileGenerator.createSourceFile("index");
    const exportDeclarations: OptionalKind<ExportDeclarationStructure>[] = [];

    exportDeclarations.push({
      moduleSpecifier: `./shared`,
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const model of this.baseParser.modelsList) {
      exportDeclarations.push({ moduleSpecifier: `./${model}` });
    }

    sourceFile.addExportDeclarations(
      exportDeclarations.sort((a, b) => compareObjectValues({ a, b, field: "moduleSpecifier" }))
    );

    await sourceFile.save();
  }
}
