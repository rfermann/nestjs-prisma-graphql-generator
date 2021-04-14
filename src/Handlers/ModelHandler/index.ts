import type { DMMF } from "@prisma/generator-helper";

import type { Enum, Field, Model } from "../../types";
import { NestJSTypes, TypeEnum } from "../../types";
import { BaseHandler } from "../BaseHandler";

const mapKindToLocation = (kind: DMMF.FieldKind): DMMF.FieldLocation => {
  switch (kind) {
    case "enum":
      return "enumTypes";

    case "object":
      return "inputObjectTypes";

    case "scalar":
      return "scalar";

    default:
      /* istanbul ignore next */
      throw new Error(`Can't map kind ${kind as string} to a location`);
  }
};

export class ModelHandler extends BaseHandler {
  private readonly _models: Model[] = [];

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
          nestJSImports: [NestJSTypes.Field, NestJSTypes.ObjectType],
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
          decorators: this.baseFileGenerator.getClassDecorator(documentation),
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

  parse(enums: Enum[]): void {
    this.baseParser.dmmf.datamodel.models.forEach(({ documentation, name, fields: modelFields }) => {
      const fields: Field[] = [];
      let enumImports: Set<string> = new Set();
      let graphqlScalarImports: Set<string> = new Set();
      let jsonImports: Set<string> = new Set();
      let modelImports: Set<string> = new Set();
      const nestJSImports: Set<string> = new Set();

      modelFields.forEach((field) => {
        const location = mapKindToLocation(field.kind);
        const parsedField = this.baseParser.parseField({ enums, field: { ...field, isInputType: false, location } });

        enumImports = this.baseParser.getEnumImports({ enumImports, field });
        graphqlScalarImports = this.baseParser.getGraphqlScalarImports({
          graphqlScalarImports,
          type: parsedField.graphQLType,
        });
        jsonImports = this.baseParser.getJsonImports({ field, jsonImports, tsType: parsedField.tsType });
        modelImports = this.baseParser.getModelImports({ field, modelImports });

        if (this.baseParser.nestJSImports.has(field.type)) {
          nestJSImports.add(field.type);
        }

        if (this.baseParser.nestJSImports.has(parsedField.graphQLType)) {
          nestJSImports.add(parsedField.graphQLType);
        }

        fields.push(parsedField);
      });

      this._models.push({
        documentation,
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
