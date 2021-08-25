/* eslint-disable max-lines */
import type { DecoratorStructure, OptionalKind, PropertyDeclarationStructure, SourceFile } from "ts-morph";
import { IndentationText, NewLineKind, Project, StructureKind } from "ts-morph";

import type { GeneratorConfig } from "../../../GeneratorConfig";
import type { Field, InputType, ObjectTypes } from "../../../types";
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

  private _inputTypes: InputType[] = [];

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

  // eslint-disable-next-line class-methods-use-this
  addDecoratorImports({
    defaultImport,
    moduleSpecifier,
    namedImports,
    sourceFile,
  }: {
    defaultImport?: string;
    moduleSpecifier: string;
    namedImports: string[];
    sourceFile: SourceFile;
  }): void {
    if (typeof defaultImport === "undefined" && namedImports.length < 1) {
      return;
    }

    sourceFile.addImportDeclaration({
      defaultImport,
      moduleSpecifier,
      namedImports: Array.from(namedImports).sort(comparePrimitiveValues),
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
    const inputTypeImports: Record<string, string[]> = {};

    types.sort(comparePrimitiveValues).forEach((type) => {
      let currentModel = this._baseParser.getModelName(type);

      if (!currentModel) {
        currentModel = "shared";
      }

      if (!inputTypeImports[currentModel]) {
        inputTypeImports[currentModel] = [];
      }

      if (type !== model) {
        inputTypeImports[currentModel].push(type);
      }
    });

    const models = Object.keys(inputTypeImports);

    // eslint-disable-next-line no-restricted-syntax
    for (const currentModel of models) {
      let moduleSpecifier = "";

      if (model && model === currentModel) {
        moduleSpecifier = `.`;
      }

      if (model && currentModel && model !== currentModel) {
        moduleSpecifier = `../../${currentModel}/${this._config.paths.inputTypes}`;
      }

      if (!model && currentModel === "shared") {
        moduleSpecifier = `.`;
      }

      if (model && !currentModel) {
        moduleSpecifier = `../../${this._config.paths.shared}/${this._config.paths.inputTypes}`;
      }

      if (isResolver) {
        moduleSpecifier = `../${this._config.paths.inputTypes}`;
      }

      if (inputTypeImports[currentModel].length) {
        sourceFile.addImportDeclaration({
          moduleSpecifier: `${moduleSpecifier}`,
          namedImports: inputTypeImports[currentModel],
        });
      }
    }
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
        moduleSpecifier = `../${model}`;
      }

      if (type === TypeEnum.Resolver) {
        moduleSpecifier = `../../${model}`;
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
    const outputTypeImports: Record<string, string[]> = {};

    types.sort(comparePrimitiveValues).forEach((type) => {
      let currentModel = this._baseParser.getModelName(type);

      if (!currentModel) {
        currentModel = "shared";
      }

      if (!outputTypeImports[currentModel]) {
        outputTypeImports[currentModel] = [];
      }

      if (type !== model) {
        outputTypeImports[currentModel].push(type);
      }
    });

    const models = Object.keys(outputTypeImports);

    // eslint-disable-next-line no-restricted-syntax
    for (const currentModel of models) {
      let moduleSpecifier = "";

      if (model && model === currentModel) {
        moduleSpecifier = `.`;
      }

      if (isResolver) {
        if (currentModel === "shared") {
          moduleSpecifier = `../../${this._config.paths.shared}/${this._config.paths.outputTypes}`;
        } else {
          moduleSpecifier = `../${this._config.paths.outputTypes}`;
        }
      }

      if (outputTypeImports[currentModel].length) {
        sourceFile.addImportDeclaration({
          moduleSpecifier: `${moduleSpecifier}`,
          namedImports: outputTypeImports[currentModel],
        });
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  addValidationDecoratorImport(sourceFile: SourceFile): void {
    sourceFile.addImportDeclarations([
      {
        kind: StructureKind.ImportDeclaration,
        moduleSpecifier: "class-transformer",
        namedImports: ["Type"],
      },
      {
        kind: StructureKind.ImportDeclaration,
        moduleSpecifier: "class-validator",
        namedImports: ["ValidateNested"],
      },
    ]);
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

  getProperties({
    decoratorType,
    fields,
  }: {
    decoratorType: TypeEnum;
    fields: Field[];
  }): OptionalKind<PropertyDeclarationStructure>[] | undefined {
    return fields.map(({ decorators, documentation, graphQLType, isNullable, isRequired, name: fieldName, tsType }) => {
      return {
        decorators: this._getPropertyDecorators({
          decorators,
          decoratorType,
          documentation,
          graphQLType,
          isNullable,
          tsType,
        }),
        docs: typeof documentation === "string" ? [documentation] : [],
        hasExclamationToken: isRequired,
        hasQuestionToken: isNullable,
        name: fieldName,
        trailingTrivia: "\r\n",
        type: tsType,
      };
    });
  }

  hasNestedValidation(name: string): boolean {
    const inputType = this._inputTypes.find((i) => i.name === name);

    if (inputType) {
      // eslint-disable-next-line no-restricted-syntax
      for (const { decorators } of inputType.fields) {
        if (decorators && decorators?.size > 0) {
          return true;
        }
      }
    }

    return false;
  }

  // eslint-disable-next-line class-methods-use-this
  normalizeTsType(tsType: string): string {
    return tsType.replace("[", "").replace("]", "");
  }

  async save(): Promise<void> {
    await this._project.save();
  }

  setInputTypes(inputTypes: InputType[]): void {
    this._inputTypes = inputTypes;
  }

  // eslint-disable-next-line max-lines-per-function
  private _getPropertyDecorators({
    decorators,
    decoratorType,
    documentation,
    graphQLType,
    isNullable,
    tsType,
  }: {
    decoratorType: TypeEnum;
    decorators?: Map<string, string>;
    documentation: string | undefined;
    graphQLType: string;
    isNullable: boolean;
    tsType: string;
  }): OptionalKind<DecoratorStructure>[] {
    const additionalDecorators: OptionalKind<DecoratorStructure>[] = [];

    if (decoratorType === TypeEnum.InputType) {
      const normalizedTsType = this.normalizeTsType(tsType);

      if (this.hasNestedValidation(normalizedTsType)) {
        additionalDecorators.push({
          arguments: [],
          kind: StructureKind.Decorator,
          name: "ValidateNested",
        });
        additionalDecorators.push({
          arguments: (writer) => writer.write(`() => ${normalizedTsType}`),
          kind: StructureKind.Decorator,
          name: "Type",
        });
      }
    }

    if (decorators) {
      const decoratorKeys = decorators.keys();

      // eslint-disable-next-line no-restricted-syntax
      for (const decoratorName of decoratorKeys) {
        const args = decorators.get(decoratorName);

        additionalDecorators.push({
          arguments: args ? [args] : [],
          kind: StructureKind.Decorator,
          name: decoratorName,
        });
      }
    }

    return [
      {
        arguments: [
          (writer) =>
            // eslint-disable-next-line max-lines
            writer
              .write(`() => ${graphQLType}, {`)
              .writeLine(`nullable: ${isNullable}`)
              .conditionalWriteLine(typeof documentation === "string", `description: "${documentation}"`)
              .write("}"),
        ],
        kind: StructureKind.Decorator,
        name: NestJSTypes.Field,
      },
      ...additionalDecorators,
    ];
  }
}
