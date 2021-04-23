import type { Enum, Field, OutputType } from "../../types";
import { NestJSTypes, ObjectTypes, OperationType, TypeEnum } from "../../types";
import { BaseHandler } from "../BaseHandler";
import { comparePrimitiveValues } from "../BaseHandler/compareFunctions";

export class OutputTypeHandler extends BaseHandler {
  private readonly _outputTypes: OutputType[] = [];

  async createBarrelFiles(): Promise<void> {
    const barrelFiles: Record<string, string[]> = {};

    // eslint-disable-next-line no-restricted-syntax
    for (const { name } of this._outputTypes) {
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
      const barrelFile = this.baseFileGenerator.createSourceFile(`${model}/${this.config.paths.outputTypes}/index`);

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
    this._outputTypes.forEach(
      ({ enumImports, fields, graphqlScalarImports, jsonImports, name, outputTypeImports, nestJSImports }) => {
        const model = this.baseParser.getModelName(name);
        const path = model || `${this.config.paths.shared}`;
        const sourceFile = this.baseFileGenerator.createSourceFile(`${path}/${this.config.paths.outputTypes}/${name}`);

        sourceFile.addClass({
          decorators: this.baseFileGenerator.getClassDecorator({ decoratorType: ObjectTypes.ObjectType }),
          isExported: true,
          name,
          properties: this.baseFileGenerator.getProperties(fields),
        });

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
          this.baseFileGenerator.addJsonImports({ sourceFile });
        }

        if (enumImports && enumImports.length > 0) {
          this.baseFileGenerator.addEnumImports({ enums: enumImports, sourceFile, type: TypeEnum.OutputType });
        }

        if (outputTypeImports && outputTypeImports.length > 0) {
          this.baseFileGenerator.addOutputTypeImports({
            model,
            sourceFile,
            types: outputTypeImports,
          });
        }

        sourceFile.formatText();
        sourceFile.save();
      }
    );

    await this.baseFileGenerator.save();
  }

  parse(enums: Enum[]): void {
    const outputTypes = this.baseParser.dmmf.schema.outputObjectTypes.prisma.filter(
      ({ name }) => name !== OperationType.Mutation && name !== OperationType.Query
    );

    outputTypes.forEach(({ name, fields: outputTypeFields }) => {
      const fields: Field[] = [];
      let enumImports: Set<string> = new Set();
      let graphqlScalarImports: Set<string> = new Set();
      let jsonImports: Set<string> = new Set();
      const outputTypeImports: Set<string> = new Set();
      const nestJSImports: Set<string> = new Set();

      outputTypeFields.forEach((field) => {
        const parsedField = this.baseParser.parseField({
          enums,
          field: { ...field, ...field.outputType, isInputType: false, isRequired: !field.isNullable },
        });

        enumImports = this.baseParser.getEnumImports({
          enumImports,
          field: { location: field.outputType.location, type: field.outputType.type },
        });

        jsonImports = this.baseParser.getJsonImports({
          field: { location: field.outputType.location, type: field.outputType.type },
          jsonImports,
          tsType: parsedField.tsType,
        });

        const baseGraphqlType = parsedField.graphQLType.replace("[", "").replace("]", "");

        if (this.baseParser.outputTypeList.has(baseGraphqlType)) {
          outputTypeImports.add(baseGraphqlType);
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

      this._outputTypes.push({
        enumImports: Array.from(enumImports),
        fields,
        graphqlScalarImports: Array.from(graphqlScalarImports),
        jsonImports: Array.from(jsonImports),
        name,
        nestJSImports: Array.from(nestJSImports),
        outputTypeImports: Array.from(outputTypeImports),
      });
    });
  }
}
