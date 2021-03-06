import type { DMMF } from "@prisma/generator-helper";

import type { GeneratorConfig } from "../../../GeneratorConfig";
import type { Enum, Field } from "../../../types";
import { NestJSTypes } from "../../../types";

interface ParseField {
  documentation?: string;
  isInputType: boolean;
  isList: boolean;
  isNullable?: boolean;
  isRequired: boolean;
  location: DMMF.FieldLocation;
  name: string;
  relationName?: string;
  type: DMMF.OutputType | DMMF.SchemaEnum | string;
}
interface TSField {
  isList: boolean;
  location: DMMF.FieldLocation;
  type: DMMF.OutputType | DMMF.SchemaEnum | string;
}

interface TSFieldOptions {
  isInputType: boolean;
  isRequired: boolean;
}

export class BaseParser {
  readonly config: GeneratorConfig;

  readonly dmmf: DMMF.Document;

  readonly graphqlScalarImports = new Set(["ByteResolver"]);

  readonly inputTypeList: Set<string> = new Set();

  readonly jsonImports = new Set(["InputJsonValue", "JsonValue"]);

  readonly modelsList: string[];

  readonly nestJSImports = new Set([
    NestJSTypes.Float as string,
    NestJSTypes.GraphQLISODateTime as string,
    NestJSTypes.GraphQLTimestamp as string,
    NestJSTypes.ID as string,
    NestJSTypes.Int as string,
  ]);

  readonly outputTypeList: Set<string> = new Set();

  readonly prismaImport = "Prisma";

  constructor(config: GeneratorConfig, dmmf: DMMF.Document) {
    this.config = config;
    this.dmmf = dmmf;

    this.dmmf.schema.inputObjectTypes.prisma.forEach(({ name }) => {
      this.inputTypeList.add(name);
    });
    this.modelsList = this.dmmf.datamodel.models.map(({ name }) => name);
    this.dmmf.schema.outputObjectTypes.prisma.forEach((outputObjectType) => {
      outputObjectType.fields.forEach(({ name }) => {
        if (this.getModelName(name)) {
          this.inputTypeList.add(this.getInputTypeName(name));
        }
      });
    });
    this.dmmf.schema.outputObjectTypes.prisma.forEach(({ name }) => {
      this.outputTypeList.add(name);
    });
  }

  getEnumImports({
    enumImports,
    field: { location, type },
  }: {
    enumImports: Set<string>;
    field: {
      location: DMMF.FieldLocation;
      type: DMMF.ArgType | DMMF.SchemaField["outputType"]["type"];
    };
  }): Set<string> {
    if (location === "enumTypes") {
      enumImports.add(this.getEnumName(type));
    }

    return enumImports;
  }

  // eslint-disable-next-line class-methods-use-this
  getEnumName(type: DMMF.ArgType | DMMF.SchemaField["outputType"]["type"]): string {
    if (typeof type === "string") {
      return `${type.replace("Enum", "")}Enum`;
    }

    return `${type.name.replace("Enum", "")}Enum`;
  }

  getGraphqlScalarImports({
    graphqlScalarImports,
    type,
  }: {
    graphqlScalarImports: Set<string>;
    type: string;
  }): Set<string> {
    if (this.graphqlScalarImports.has(type)) {
      graphqlScalarImports.add(type);
    }

    return graphqlScalarImports;
  }

  // eslint-disable-next-line class-methods-use-this
  getInputType(inputTypes: DMMF.SchemaArgInputType[]): TSField {
    if (inputTypes.length === 0) {
      /* istanbul ignore next */
      throw new Error("No input types available. Extracting GraphQL Type not possible");
    }

    const isList = inputTypes.find((inputType) => inputType.isList)?.isList ?? false;

    let inputTypeObject = inputTypes.find(
      (it) => it.location === "inputObjectTypes" || it.location === "outputObjectTypes"
    );

    if (typeof inputTypeObject === "undefined") {
      inputTypeObject = inputTypes.find((it) => it.location === "enumTypes");
    }

    if (typeof inputTypeObject === "undefined") {
      inputTypeObject = inputTypes.find((it) => it.location === "scalar");
    }

    if (typeof inputTypeObject === "undefined") {
      /* istanbul ignore next */
      throw new Error("Couldn't parse input type");
    }

    return {
      isList,
      location: inputTypeObject.location,
      type: inputTypeObject.type as string,
    };
  }

  getInputTypeName(name: string): string {
    return `${this.pascalCase(name)}${this.pascalCase(this.config.inputArgumentsName)}`;
  }

  getJsonImports({
    field: { location, type },
    jsonImports,
    tsType,
  }: {
    field: {
      location: DMMF.FieldLocation;
      type: DMMF.ArgType | DMMF.SchemaField["outputType"]["type"];
    };
    jsonImports: Set<string>;
    tsType: string;
  }): Set<string> {
    let stringType = "";

    if (typeof type === "string") {
      stringType = type;
    } else {
      stringType = type.name;
    }

    if (location === "scalar" && this.jsonImports.has(stringType.replace(`${this.prismaImport}.`, ""))) {
      jsonImports.add(stringType);
    }

    if (this.jsonImports.has(tsType.replace(`${this.prismaImport}.`, "").split(" | ")[0])) {
      jsonImports.add(tsType.split(" | ")[0]);
    }

    return jsonImports;
  }

  getModelName(input: string): string | undefined {
    // eslint-disable-next-line @typescript-eslint/init-declarations
    let modelName: ReturnType<BaseParser["getModelName"]>;
    const cleansedInput = input.replace(this.pascalCase(this.config.inputArgumentsName), "");

    this.modelsList.forEach((model) => {
      if (cleansedInput.startsWith(model) || cleansedInput.endsWith(model)) {
        modelName = model;
      }
    });

    return modelName;
  }

  parseField({
    enums,
    field,
    field: { documentation, isInputType, isList, isRequired, location, name, relationName, type },
  }: {
    enums: Enum[];
    field: ParseField;
  }): Field {
    let { isNullable } = field;

    if (typeof isNullable === "undefined" || !isNullable) {
      isNullable = Boolean(relationName) || !isRequired;
    }

    return {
      documentation,
      graphQLType: this.parseGraphQLType([{ isList, location, type: type as DMMF.ArgType }]),
      isNullable,
      isRequired,
      name,
      tsType: this.parseTSFieldType({
        enums,
        field: { isList, location, type },
        fieldOptions: {
          isInputType,
          isRequired,
        },
      }),
    };
  }

  parseGraphQLType(inputTypes: DMMF.SchemaArgInputType[]): string {
    let inputType = "";
    const inputTypeObject = this.getInputType(inputTypes);
    const { isList, location, type } = inputTypeObject;

    if (location === "enumTypes") {
      inputType = this.getEnumName(type as string);
    } else {
      inputType = `${type as string}`;
    }

    inputType = this._mapScalarToGraphQLType(inputType);

    if (isList) {
      return `[${inputType}]`;
    }

    return inputType;
  }

  parseTSFieldType({
    enums,
    field: { isList, location, type },
    fieldOptions: { isInputType, isRequired },
  }: {
    enums: Enum[];
    field: TSField;
    fieldOptions: TSFieldOptions;
  }): string {
    let fieldType = "";

    if (typeof type !== "string") {
      throw new Error(`Unsupported field type : ${JSON.stringify(type)}`);
    }

    if (location === "enumTypes") {
      if (enums.length < 1) {
        throw new Error("Cannot read enums. Please make sure to pass a valid enum array to this function");
      }

      fieldType = enums
        .find((e) => this.getEnumName(e.name) === this.getEnumName(type))
        ?.values.map((value) => `"${value.name}"`)
        .join(" | ") as string;
    } else if (location === "inputObjectTypes" || location === "outputObjectTypes") {
      fieldType = type;
    } else if (location === "scalar") {
      fieldType = this._mapScalarToTSType({ scalar: type });
    } else {
      throw new Error(`Unsupported field location: ${location}`);
    }

    if (this.jsonImports.has(fieldType)) {
      fieldType = `${this.prismaImport}.${fieldType}`;
    }

    if (isList) {
      if (fieldType.includes(" ")) {
        fieldType = `Array<${fieldType}>`;
      } else {
        fieldType = `${fieldType}[]`;
      }
    }

    if (!isRequired) {
      if (isInputType) {
        fieldType = `${fieldType} | undefined`;
      } else {
        fieldType = `${fieldType} | null`;
      }
    }

    return fieldType;
  }

  // eslint-disable-next-line class-methods-use-this
  pascalCase(word: string): string {
    return `${word.charAt(0).toLocaleUpperCase()}${word.slice(1)}`;
  }

  // eslint-disable-next-line class-methods-use-this
  private _mapScalarToGraphQLType(scalar: string): string {
    switch (scalar) {
      case "Bytes":
        return "ByteResolver";

      case "DateTime":
        return "GraphQLISODateTime";

      case "Json":
        return "GraphQLJSON";

      default:
        return scalar;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private _mapScalarToTSType({ scalar }: { scalar: string }): string {
    switch (scalar) {
      case "BigInt":
        return "bigint";

      case "Boolean":
        return "boolean";

      case "Bytes":
        return "Buffer";

      case "DateTime":
        return "Date";

      case "Decimal":
        return "number";

      case "Float":
        return "number";

      case "Int":
        return "number";

      case "Json":
        return "JsonValue";

      case "String":
        return "string";

      default:
        throw new Error(`Unknown scalar type ${scalar}`);
    }
  }
}
