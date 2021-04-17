import type { Enum, Field, InputType } from "../../types";
import { NestJSTypes, ObjectTypes, TypeEnum } from "../../types";
import { BaseHandler } from "../BaseHandler";

export class InputTypeHandler extends BaseHandler {
  private readonly _inputTypes: InputType[] = [];

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
            inputTypes: inputTypeImports,
            model,
            sourceFile,
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
    const inputObjectTypes = this.baseParser.dmmf.schema.inputObjectTypes.prisma.filter(
      (inputType) => !inputType.name.toLowerCase().includes("unchecked")
    );

    // eslint-disable-next-line max-lines-per-function
    inputObjectTypes.forEach(({ name, fields: modelFields }) => {
      const fields: Field[] = [];
      let enumImports: Set<string> = new Set();
      let graphqlScalarImports: Set<string> = new Set();
      let jsonImports: Set<string> = new Set();
      const inputTypeImports: Set<string> = new Set();
      const nestJSImports: Set<string> = new Set();

      modelFields.forEach((field) => {
        const inputTypes = field.inputTypes.filter(
          (inputType) => !inputType.type.toString().toLowerCase().includes("unchecked")
        );

        const currentInputType = this.baseParser.getInputType(inputTypes);

        const parsedField = this.baseParser.parseField({
          enums,
          field: { ...field, ...currentInputType, isInputType: true },
        });

        graphqlScalarImports = this.baseParser.getGraphqlScalarImports({
          graphqlScalarImports,
          type: parsedField.graphQLType,
        });

        inputTypes.forEach(({ location, type }) => {
          if (this.baseParser.getEnumName(type) === parsedField.graphQLType) {
            enumImports = this.baseParser.getEnumImports({ enumImports, field: { location, type } });
          }

          jsonImports = this.baseParser.getJsonImports({
            field: { location, type },
            jsonImports,
            tsType: parsedField.tsType,
          });
        });

        const baseGraphqlType = parsedField.graphQLType.replace("[", "").replace("]", "");

        // prevent a type from importing itself
        if (name === baseGraphqlType) {
          return;
        }

        if (this.baseParser.inputTypeList.has(baseGraphqlType)) {
          inputTypeImports.add(baseGraphqlType);
        }

        graphqlScalarImports = this.baseParser.getGraphqlScalarImports({
          graphqlScalarImports,
          type: parsedField.graphQLType,
        });

        if (this.baseParser.nestJSImports.has(parsedField.graphQLType)) {
          nestJSImports.add(parsedField.graphQLType);
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
