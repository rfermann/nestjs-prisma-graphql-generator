import type { DMMF } from "@prisma/generator-helper";

import type { Enum, Field, Model } from "../../types";
import { NestJSTypes, ObjectTypes, TypeEnum } from "../../types";
import { BaseHandler } from "../BaseHandler";

export class ModelHandler extends BaseHandler {
  private readonly _models: Model[] = [];

  // eslint-disable-next-line max-lines-per-function
  async createFiles(): Promise<void> {
    this._models.forEach(
      ({
        documentation,
        enumImports,
        fields,
        graphqlScalarImports,
        jsonImports,
        modelImports,
        name,
        nestJSImports,
      }) => {
        const sourceFile = this.baseFileGenerator.createSourceFile(`${name}/${this.config.paths.model}`);

        this.baseFileGenerator.addNestJSImports({
          nestJSImports: [NestJSTypes.Field, ObjectTypes.ObjectType],
          sourceFile,
        });

        if (nestJSImports && nestJSImports.length > 0) {
          this.baseFileGenerator.addNestJSImports({ nestJSImports, sourceFile });
        }

        if (graphqlScalarImports && graphqlScalarImports.length > 0) {
          this.baseFileGenerator.addGraphqlScalarImports({ imports: graphqlScalarImports, sourceFile });
        }

        if (jsonImports && jsonImports.length > 0) {
          this.baseFileGenerator.addJsonImports({ imports: jsonImports, sourceFile });
        }

        if (enumImports && enumImports.length > 0) {
          this.baseFileGenerator.addEnumImports({ enums: enumImports, sourceFile, type: TypeEnum.ModelType });
        }

        if (modelImports && modelImports.length > 0) {
          this.baseFileGenerator.addModelImports({
            models: modelImports,
            sourceFile,
            type: TypeEnum.ModelType,
          });
        }

        sourceFile.addClass({
          decorators: this.baseFileGenerator.getClassDecorator({
            decoratorType: ObjectTypes.ObjectType,
            documentation,
          }),
          docs: typeof documentation === "string" ? [documentation] : [],
          isExported: true,
          name,
          properties: this.baseFileGenerator.getProperties(fields),
        });

        sourceFile.formatText();
      }
    );

    await this.baseFileGenerator.save();
  }

  // eslint-disable-next-line max-lines-per-function
  parse(enums: Enum[]): void {
    // eslint-disable-next-line max-lines-per-function
    this.baseParser.dmmf.schema.outputObjectTypes.model.forEach(({ name, fields: modelFields }) => {
      const fields: Field[] = [];
      let enumImports: Set<string> = new Set();
      let graphqlScalarImports: Set<string> = new Set();
      let jsonImports: Set<string> = new Set();
      const modelImports: Set<string> = new Set();
      const nestJSImports: Set<string> = new Set();
      const datamodel = this.baseParser.dmmf.datamodel.models.find((model) => model.name === name);

      modelFields.forEach(({ isNullable: isNullableBase, name: fieldName, outputType }) => {
        const { location, type } = outputType as { location: DMMF.FieldLocation; type: string };
        /* istanbul ignore next */
        const fieldModel = datamodel?.fields.find((f) => f.name === fieldName);
        const isNullable = outputType.location === "outputObjectTypes" ? true : isNullableBase;

        const parsedField = this.baseParser.parseField({
          enums,
          field: {
            /* istanbul ignore next */
            documentation: fieldModel?.documentation,
            isInputType: false,
            isList: outputType.isList,
            isRequired: !isNullable,
            location,
            name: fieldName,
            type,
          },
        });

        enumImports = this.baseParser.getEnumImports({
          enumImports,
          field: { location, type },
        });
        graphqlScalarImports = this.baseParser.getGraphqlScalarImports({
          graphqlScalarImports,
          type: parsedField.graphQLType,
        });

        jsonImports = this.baseParser.getJsonImports({
          field: { location, type },
          jsonImports,
          tsType: parsedField.tsType,
        });
        if (location === "outputObjectTypes") {
          modelImports.add(type);
        }

        if (this.baseParser.nestJSImports.has(type)) {
          nestJSImports.add(type);
        }

        if (this.baseParser.nestJSImports.has(parsedField.graphQLType)) {
          nestJSImports.add(parsedField.graphQLType);
        }

        fields.push(parsedField);
      });

      this._models.push({
        /* istanbul ignore next */
        documentation: datamodel?.documentation,
        enumImports: Array.from(enumImports),
        fields,
        graphqlScalarImports: Array.from(graphqlScalarImports),
        jsonImports: Array.from(jsonImports),
        modelImports: Array.from(modelImports),
        name,
        nestJSImports: Array.from(nestJSImports),
      });
    });
  }
}
