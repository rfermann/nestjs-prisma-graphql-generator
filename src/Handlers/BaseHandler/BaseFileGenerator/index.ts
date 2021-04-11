import type { SourceFile } from "ts-morph";
import { IndentationText, NewLineKind, Project } from "ts-morph";

import type { GeneratorConfig } from "../../../GeneratorConfig";
import { NestJSTypes } from "../../../types";
import { comparePrimitiveValues } from "../compareFunctions";

interface NestJSImportOptions {
  nestJSImports: string[];
  sourceFile: SourceFile;
}

export class BaseFileGenerator {
  private readonly _config: GeneratorConfig;

  private readonly _project: Project;

  constructor(config: GeneratorConfig) {
    this._config = config;
    this._project = new Project({
      compilerOptions: {
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
      },
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces,
        newLineKind: NewLineKind.LineFeed,
      },
    });
  }

  // eslint-disable-next-line class-methods-use-this
  addNestJSImports({ nestJSImports, sourceFile }: NestJSImportOptions): void {
    if (nestJSImports.length < 1) {
      return;
    }

    const importDeclarations = sourceFile.getImportDeclarations();

    let nestJSImportDeclaration = importDeclarations.find(
      (declaration) => declaration.getModuleSpecifier().getLiteralText() === NestJSTypes.ImportPath
    );

    const imports = nestJSImports;

    if (typeof nestJSImportDeclaration === "undefined") {
      nestJSImportDeclaration = sourceFile.addImportDeclaration({ moduleSpecifier: NestJSTypes.ImportPath });
    } else {
      nestJSImportDeclaration.getNamedImports().forEach((namedImport) => imports.push(namedImport.getText()));
      nestJSImportDeclaration.removeNamedImports();
    }

    nestJSImportDeclaration.addNamedImports(Array.from(new Set(imports)).sort(comparePrimitiveValues));
  }

  createSourceFile(name: string): SourceFile {
    return this._project.createSourceFile(`${this._config.basePath}/${name}.ts`, undefined, {
      overwrite: true,
    });
  }

  async save(): Promise<void> {
    await this._project.save();
  }
}
