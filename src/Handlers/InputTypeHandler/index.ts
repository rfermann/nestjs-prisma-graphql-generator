import type { DMMF } from "@prisma/generator-helper";

import type { Enum, Field, InputType } from "../../types";
import { NestJSTypes, ObjectTypes, OperationType, TypeEnum } from "../../types";
import { BaseHandler } from "../BaseHandler";
import { comparePrimitiveValues } from "../BaseHandler/compareFunctions";

export class InputTypeHandler extends BaseHandler {
  private readonly _inputTypes: InputType[] = [];

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

  async createFiles(): Promise<void> {
    this._inputTypes.forEach(
      ({ enumImports, fields, graphqlScalarImports, inputTypeImports, jsonImports, name, nestJSImports }) => {
        const model = this.baseParser.getModelName(name);
        const path = model || `${this.config.paths.shared}`;
        const sourceFile = this.baseFileGenerator.createSourceFile(`${path}/${this.config.paths.inputTypes}/${name}`);

        sourceFile.addClass({
          decorators: this.baseFileGenerator.getClassDecorator({ decoratorType: ObjectTypes.InputType }),
          isExported: true,
          name,

          properties: this.baseFileGenerator.getProperties(fields),
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

  // eslint-disable-next-line max-lines-per-function
  parse(enums: Enum[]): void {
    const inputTypes: { fields: DMMF.SchemaArg[]; name: string }[] = [];

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

      modelFields.forEach((field) => {
        const fieldInputTypes = field.inputTypes.filter(
          (inputType) => !inputType.type.toString().toLowerCase().includes("unchecked")
        );

        const currentInputType = this.baseParser.getInputType(fieldInputTypes);

        const parsedField = this.baseParser.parseField({
          enums,
          field: { ...field, ...currentInputType, isInputType: true },
        });

        graphqlScalarImports = this.baseParser.getGraphqlScalarImports({
          graphqlScalarImports,
          type: parsedField.graphQLType,
        });

        const baseGraphqlType = parsedField.graphQLType.replace("[", "").replace("]", "");

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
}
