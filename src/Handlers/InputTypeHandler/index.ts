// eslint-disable-next-line import/no-nodejs-modules
import { dirname, join, relative, resolve } from "path";

import type { DMMF } from "@prisma/generator-helper";
import type { SourceFile } from "ts-morph";
import { IndentationText, NewLineKind, Project, StructureKind, SyntaxKind, VariableDeclarationKind } from "ts-morph";

import type { Enum, Field, InputType } from "../../types";
import { NestJSTypes, ObjectTypes, OperationType, TypeEnum } from "../../types";
import { BaseHandler } from "../BaseHandler";
import { comparePrimitiveValues } from "../BaseHandler/compareFunctions";

const enum ImportTypeEnum {
  DefaultImport = "DefaultImport",
  NamedImports = "NamedImports",
}

export class InputTypeHandler extends BaseHandler {
  private readonly _inputTypeDecoratorImports: Map<string, Map<string, Set<string>>> = new Map();

  private readonly _inputTypeDecorators: Map<string, Map<string, Map<string, string>>> = new Map();

  private readonly _inputTypes: InputType[] = [];

  addDecoratorImports({ fields, sourceFile }: { fields: Field[]; sourceFile: SourceFile }): void {
    const decoratorSet = new Set();

    // eslint-disable-next-line no-restricted-syntax
    for (const { decorators } of fields) {
      const decoratorKeys = decorators?.keys();

      if (decoratorKeys) {
        // eslint-disable-next-line no-restricted-syntax
        for (const key of decoratorKeys) {
          decoratorSet.add(key);
        }
      }
    }

    if (this._inputTypeDecoratorImports.size < 1) {
      return;
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const moduleSpecifier of this._inputTypeDecoratorImports.keys()) {
      const imports = this._inputTypeDecoratorImports.get(moduleSpecifier);

      if (imports) {
        const defaultImport: string[] = [];
        const namedImportSet: Set<string> = new Set();

        // eslint-disable-next-line no-restricted-syntax
        for (const value of imports.get(ImportTypeEnum.DefaultImport)?.keys() || []) {
          if (decoratorSet.has(value)) {
            defaultImport.push(value);
          }
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const value of imports.get(ImportTypeEnum.NamedImports)?.keys() || []) {
          if (decoratorSet.has(value)) {
            namedImportSet.add(value);
          }
        }

        if (imports) {
          this.baseFileGenerator.addDecoratorImports({
            defaultImport: defaultImport[0],
            moduleSpecifier,
            namedImports: Array.from(namedImportSet.size > 0 ? namedImportSet : []),
            sourceFile,
          });
        }
      }
    }
  }

  async createBarrelFiles(): Promise<void> {
    const barrelFiles: Record<string, string[]> = {};

    // eslint-disable-next-line no-restricted-syntax
    for (const { name } of this._inputTypes) {
      let model = this.baseParser.getModelName(name);

      if (!model) {
        model = "shared";
      }

      if (!barrelFiles[model]) {
        barrelFiles[model] = [];
      }

      barrelFiles[model].push(name);
    }

    const models = Object.keys(barrelFiles);

    // eslint-disable-next-line no-restricted-syntax
    for (const model of models) {
      const barrelFile = this.baseFileGenerator.createSourceFile(`${model}/${this.config.paths.inputTypes}/index`);

      barrelFiles[model].sort(comparePrimitiveValues).forEach((resolver) => {
        barrelFile.addExportDeclaration({
          moduleSpecifier: `./${resolver}`,
          namedExports: [resolver],
        });
      });

      // eslint-disable-next-line no-await-in-loop
      await barrelFile.save();
    }
  }

  // eslint-disable-next-line max-lines-per-function
  async createFiles(): Promise<void> {
    this.baseFileGenerator.setInputTypes(this._inputTypes);
    this._inputTypes.forEach(
      ({ enumImports, fields, graphqlScalarImports, inputTypeImports, jsonImports, name, nestJSImports }) => {
        const model = this.baseParser.getModelName(name);
        const path = model || `${this.config.paths.shared}`;
        const sourceFile = this.baseFileGenerator.createSourceFile(`${path}/${this.config.paths.inputTypes}/${name}`);

        sourceFile.addClass({
          decorators: this.baseFileGenerator.getClassDecorator({ decoratorType: ObjectTypes.InputType }),
          isExported: true,
          name,
          properties: this.baseFileGenerator.getProperties({ decoratorType: TypeEnum.InputType, fields }),
        });

        this.baseFileGenerator.addNestJSImports({
          nestJSImports: [NestJSTypes.Field, ObjectTypes.InputType],
          sourceFile,
        });

        if (nestJSImports && nestJSImports.length > 0) {
          this.baseFileGenerator.addNestJSImports({ nestJSImports, sourceFile });
        }

        if (graphqlScalarImports && graphqlScalarImports.length > 0) {
          this.baseFileGenerator.addGraphqlScalarImports({ imports: graphqlScalarImports, sourceFile });
        }

        if (jsonImports && jsonImports.length > 0) {
          this.baseFileGenerator.addJsonImports({ sourceFile });
        }

        let hasValidationDecorator = false;

        // eslint-disable-next-line no-restricted-syntax
        for (const { tsType } of fields) {
          hasValidationDecorator = this.baseFileGenerator.hasNestedValidation(
            this.baseFileGenerator.normalizeTsType(tsType)
          );
          if (hasValidationDecorator) {
            this.baseFileGenerator.addValidationDecoratorImport(sourceFile);
            break;
          }
        }

        this.addDecoratorImports({ fields, sourceFile });

        if (enumImports && enumImports.length > 0) {
          this.baseFileGenerator.addEnumImports({ enums: enumImports, sourceFile, type: TypeEnum.InputType });
        }

        if (inputTypeImports && inputTypeImports.length > 0) {
          this.baseFileGenerator.addInputTypeImports({
            model,
            sourceFile,
            types: inputTypeImports,
          });
        }

        sourceFile.formatText();
        sourceFile.save();
      }
    );

    await this.baseFileGenerator.save();
  }

  getInputTypes(): InputType[] {
    return this._inputTypes;
  }

  // eslint-disable-next-line max-lines-per-function
  parse(enums: Enum[]): void {
    const inputTypes: { fields: DMMF.SchemaArg[]; name: string }[] = [];

    this._parseInputTypeDecorators();

    this.baseParser.dmmf.schema.inputObjectTypes.prisma
      .filter((inputType) => !inputType.name.toLowerCase().includes("unchecked"))
      .forEach(({ fields, name }) => {
        inputTypes.push({ fields, name });
      });

    this.baseParser.dmmf.schema.outputObjectTypes.prisma
      .filter(({ name }) => name === OperationType.Mutation || name === OperationType.Query)
      .forEach(({ fields }) => {
        fields
          .filter(({ name }) => {
            if (
              this.baseParser.dmmf.mappings.otherOperations.read.includes(name) ||
              this.baseParser.dmmf.mappings.otherOperations.write.includes(name)
            ) {
              return false;
            }

            return true;
          })
          .forEach(({ args, name }) => {
            inputTypes.push({ fields: args, name: this.baseParser.getInputTypeName(name) });
          });
      });

    // eslint-disable-next-line max-lines-per-function
    inputTypes.forEach(({ name, fields: modelFields }) => {
      const fields: Field[] = [];
      let enumImports: Set<string> = new Set();
      let graphqlScalarImports: Set<string> = new Set();
      let jsonImports: Set<string> = new Set();
      const inputTypeImports: Set<string> = new Set();
      const nestJSImports: Set<string> = new Set();
      const decoratedFields = this._inputTypeDecorators.get(name);

      modelFields.forEach((field) => {
        const fieldInputTypes = field.inputTypes.filter(
          (inputType) => !inputType.type.toString().toLowerCase().includes("unchecked")
        );

        const currentInputType = this.baseParser.getInputType(fieldInputTypes);

        const parsedField = this.baseParser.parseField({
          enums,
          field: { ...field, ...currentInputType, isInputType: true },
        });

        const decorators = decoratedFields?.get(parsedField.name);

        if (typeof decorators !== "undefined") {
          parsedField.decorators = decorators;
        }

        graphqlScalarImports = this.baseParser.getGraphqlScalarImports({
          graphqlScalarImports,
          type: parsedField.graphQLType,
        });

        const baseGraphqlType = this.baseFileGenerator.normalizeTsType(parsedField.graphQLType);

        fieldInputTypes.forEach(({ location, type }) => {
          if (this.baseParser.getEnumName(type) === baseGraphqlType) {
            enumImports = this.baseParser.getEnumImports({ enumImports, field: { location, type } });
          }

          jsonImports = this.baseParser.getJsonImports({
            field: { location, type },
            jsonImports,
            tsType: parsedField.tsType,
          });
        });

        // prevent a type from importing itself
        if (name === baseGraphqlType) {
          return;
        }

        if (this.baseParser.inputTypeList.has(baseGraphqlType)) {
          inputTypeImports.add(baseGraphqlType);
        }

        graphqlScalarImports = this.baseParser.getGraphqlScalarImports({
          graphqlScalarImports,
          type: baseGraphqlType,
        });

        if (this.baseParser.nestJSImports.has(baseGraphqlType)) {
          nestJSImports.add(baseGraphqlType);
        }

        fields.push(parsedField);
      });

      this._inputTypes.push({
        enumImports: Array.from(enumImports),
        fields,
        graphqlScalarImports: Array.from(graphqlScalarImports),
        inputTypeImports: Array.from(inputTypeImports),
        jsonImports: Array.from(jsonImports),
        name,
        nestJSImports: Array.from(nestJSImports),
      });
    });
  }

  // eslint-disable-next-line max-lines-per-function
  private _parseInputTypeDecorators(): void {
    if (this.config.inputTypeDecoratorsPath) {
      const project = new Project({
        compilerOptions: {
          emitDecoratorMetadata: true,
          experimentalDecorators: true,
        },
        manipulationSettings: {
          indentationText: IndentationText.TwoSpaces,
          newLineKind: NewLineKind.LineFeed,
        },
      });

      let inputDecoratorFile = project.addSourceFileAtPathIfExists(
        join(this.config.basePath, this.config.inputTypeDecoratorsPath)
      );

      if (!inputDecoratorFile) {
        inputDecoratorFile = project.createSourceFile(
          join(this.config.basePath, this.config.inputTypeDecoratorsPath),
          undefined,
          { overwrite: true }
        );

        inputDecoratorFile.addImportDeclaration({
          kind: StructureKind.ImportDeclaration,
          moduleSpecifier: `./${relative(
            dirname(resolve(join(this.config.basePath, this.config.inputTypeDecoratorsPath))),
            resolve(join(this.config.basePath, this.config.paths.inputTypeDecorators))
          )}`,
          namedImports: ["InputTypeDecorators"],
        });

        inputDecoratorFile.addVariableStatement({
          declarationKind: VariableDeclarationKind.Const,
          declarations: [{ initializer: "{}", name: "inputTypeDecorators", type: "InputTypeDecorators" }],
          isExported: true,
          kind: StructureKind.VariableStatement,
        });
        inputDecoratorFile.save();
      }

      const importDeclarations = inputDecoratorFile.getImportDeclarations();

      importDeclarations.forEach((imp) => {
        const imports: Map<ImportTypeEnum, Set<string>> = new Map();
        const namedImports: Set<string> = new Set();

        imp.getNamedImports().forEach((namedImport) => namedImports.add(namedImport.getText()));
        imports.set(ImportTypeEnum.NamedImports, namedImports);

        const defaultImport = imp.getDefaultImport()?.getText();

        if (defaultImport) {
          imports.set(ImportTypeEnum.DefaultImport, new Set([defaultImport]));
        }

        this._inputTypeDecoratorImports.set(imp.getModuleSpecifierValue(), imports);
      });

      const inputTypes = inputDecoratorFile
        .getVariableDeclaration("inputTypeDecorators")
        ?.getFirstChildByKind(SyntaxKind.ObjectLiteralExpression)
        ?.getChildrenOfKind(SyntaxKind.PropertyAssignment);

      inputTypes?.forEach((inputType) => {
        const decorators: Map<string, Map<string, string>> = new Map();

        inputType.getChildrenOfKind(SyntaxKind.ObjectLiteralExpression)?.forEach((objectLiteralExpression) => {
          objectLiteralExpression.getChildrenOfKind(SyntaxKind.PropertyAssignment).forEach((propertyAssignment) => {
            const propertyDecorators: Map<string, string> = new Map();

            propertyAssignment.getChildrenOfKind(SyntaxKind.ArrayLiteralExpression).forEach((arrayLiteralExpression) =>
              arrayLiteralExpression.getElements().forEach((el) => {
                const elementText = el.getText();
                const identifier = elementText.split("(")[0];
                const args = elementText.split("(")[1];

                propertyDecorators.set(identifier, args.slice(0, -1));
              })
            );
            propertyAssignment.getChildrenOfKind(SyntaxKind.CallExpression).forEach((callExpression) => {
              const elementText = callExpression.getText();
              const identifier = elementText.split("(")[0];
              const args = elementText.split("(")[1];

              propertyDecorators.set(identifier, args.slice(0, -1));
            });

            if (propertyDecorators.size > 0) {
              decorators.set(propertyAssignment.getName(), propertyDecorators);
            }
          });
        });

        if (decorators.size > 0) {
          this._inputTypeDecorators.set(inputType.getName(), decorators);
        }
      });
    }
  }
}
