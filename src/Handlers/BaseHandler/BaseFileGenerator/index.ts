import type { DecoratorStructure, OptionalKind, PropertyDeclarationStructure, SourceFile } from "ts-morph";
import { IndentationText, NewLineKind, Project, StructureKind } from "ts-morph";

import type { GeneratorConfig } from "../../../GeneratorConfig";
import type { Field, ObjectTypes } from "../../../types";
import { NestJSTypes, TypeEnum } from "../../../types";
import type { BaseParser } from "../BaseParser";
import { comparePrimitiveValues } from "../compareFunctions";

interface NestJSImportOptions {
  nestJSImports: string[];
  sourceFile: SourceFile;
}

export class BaseFileGenerator {
  private readonly _baseParser: BaseParser;

  private readonly _config: GeneratorConfig;

  private readonly _project: Project;

  constructor(baseParser: BaseParser, config: GeneratorConfig) {
    this._baseParser = baseParser;
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

  addEnumImports({ enums, sourceFile, type }: { enums: string[]; sourceFile: SourceFile; type: TypeEnum }): void {
    let moduleSpecifier = "";

    if (type === TypeEnum.InputType || type === TypeEnum.OutputType) {
      moduleSpecifier = `../../${this._config.paths.enums}`;
    }

    if (type === TypeEnum.ModelType) {
      moduleSpecifier = `../${this._config.paths.enums}`;
    }

    sourceFile.addImportDeclaration({
      moduleSpecifier,
      namedImports: Array.from(enums).sort(comparePrimitiveValues),
    });
  }

  // eslint-disable-next-line class-methods-use-this
  addGraphqlScalarImports({ imports, sourceFile }: { imports: string[]; sourceFile: SourceFile }): void {
    sourceFile.addImportDeclaration({
      moduleSpecifier: "graphql-scalars",
      namedImports: imports.sort(comparePrimitiveValues),
    });
  }

  addInputTypeImports({
    isResolver = false,
    model,
    sourceFile,
    types,
  }: {
    isResolver?: boolean;
    model?: string;
    sourceFile: SourceFile;
    types: string[];
  }): void {
    types.sort(comparePrimitiveValues).forEach((type) => {
      let moduleSpecifier = "";
      const currentModel = this._baseParser.getModelName(type);

      if (model && model === currentModel) {
        moduleSpecifier = `.`;
      }

      if (model && currentModel && model !== currentModel) {
        moduleSpecifier = `../../${currentModel}/${this._config.paths.inputTypes}`;
      }

      if (!model && !currentModel) {
        moduleSpecifier = `.`;
      }

      if (model && !currentModel) {
        moduleSpecifier = `../../${this._config.paths.shared}/${this._config.paths.inputTypes}`;
      }

      if (isResolver) {
        moduleSpecifier = `../${this._config.paths.inputTypes}`;
      }

      sourceFile.addImportDeclaration({
        moduleSpecifier: `${moduleSpecifier}/${type}`,
        namedImports: [type],
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  addJsonImports({ sourceFile }: { sourceFile: SourceFile }): void {
    sourceFile.addImportDeclaration({
      moduleSpecifier: "@prisma/client",
      namedImports: [this._baseParser.prismaImport],
    });
    sourceFile.addImportDeclaration({
      moduleSpecifier: "graphql-type-json",
      namedImports: ["GraphQLJSON"],
    });
  }

  // eslint-disable-next-line class-methods-use-this
  addModelImports({ models, sourceFile, type }: { models: string[]; sourceFile: SourceFile; type: TypeEnum }): void {
    models.sort(comparePrimitiveValues).forEach((model) => {
      let moduleSpecifier = "";

      if (type === TypeEnum.InputType || type === TypeEnum.ModelType) {
        moduleSpecifier = `../${model}/model`;
      }

      if (type === TypeEnum.Resolver) {
        moduleSpecifier = `../../${model}/model`;
      }

      sourceFile.addImportDeclaration({
        moduleSpecifier,
        namedImports: [model],
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  addNestJSImports({ nestJSImports, sourceFile }: NestJSImportOptions): void {
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

  addOutputTypeImports({
    isResolver = false,
    sourceFile,
    types,
    model,
  }: {
    isResolver?: boolean;
    model?: string;
    sourceFile: SourceFile;
    types: string[];
  }): void {
    types.sort(comparePrimitiveValues).forEach((type) => {
      if (type === model) {
        return;
      }

      let moduleSpecifier = "";
      const currentModel = this._baseParser.getModelName(type);

      if (model && model === currentModel) {
        if (isResolver) {
          moduleSpecifier = `../${this._config.paths.outputTypes}`;
        } else {
          moduleSpecifier = `.`;
        }
      }

      if (model && !currentModel) {
        moduleSpecifier = `../../${this._config.paths.shared}/${this._config.paths.outputTypes}`;
      }

      sourceFile.addImportDeclaration({
        moduleSpecifier: `${moduleSpecifier}/${type}`,
        namedImports: [type],
      });
    });
  }

  createSourceFile(name: string): SourceFile {
    return this._project.createSourceFile(`${this._config.basePath}/${name}.ts`, undefined, {
      overwrite: true,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  getClassDecorator({
    decoratorType,
    documentation,
    isAbstract = true,
    returnType,
  }: {
    decoratorType: ObjectTypes;
    documentation?: string;
    isAbstract?: boolean;
    returnType?: string;
  }): OptionalKind<DecoratorStructure>[] {
    return [
      {
        arguments: [
          (writer) =>
            writer
              .conditionalWriteLine(typeof returnType !== "string", "{")
              .conditionalWriteLine(typeof returnType === "string", `() => ${returnType}, {`)
              .writeLine(`isAbstract: ${isAbstract},`)
              .conditionalWriteLine(typeof documentation === "string", `description: "${documentation}"`)
              .write("}"),
        ],
        kind: StructureKind.Decorator,
        name: decoratorType,
      },
    ];
  }

  getProperties(fields: Field[]): OptionalKind<PropertyDeclarationStructure>[] | undefined {
    return fields.map(({ documentation, graphQLType, isNullable, isRequired, name, tsType }) => {
      return {
        decorators: this._getPropertyDecorators({ documentation, graphQLType, isNullable }),
        docs: typeof documentation === "string" ? [documentation] : [],
        hasExclamationToken: isRequired,
        hasQuestionToken: isNullable,
        name,
        trailingTrivia: "\r\n",
        type: tsType,
      };
    });
  }

  async save(): Promise<void> {
    await this._project.save();
  }

  // eslint-disable-next-line class-methods-use-this
  private _getPropertyDecorators({
    documentation,
    graphQLType,
    isNullable,
  }: {
    documentation: string | undefined;
    graphQLType: string;
    isNullable: boolean;
  }): OptionalKind<DecoratorStructure>[] {
    return [
      {
        arguments: [
          (writer) =>
            writer
              .write(`() => ${graphQLType}, {`)
              .writeLine(`nullable: ${isNullable}`)
              .conditionalWriteLine(typeof documentation === "string", `description: "${documentation}"`)
              .write("}"),
        ],
        kind: StructureKind.Decorator,
        name: NestJSTypes.Field,
      },
    ];
  }
}
