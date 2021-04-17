import type { DMMF } from "@prisma/generator-helper";

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

  readonly prismaImport = "Prisma";

  constructor(dmmf: DMMF.Document) {
    this.dmmf = dmmf;

    this.dmmf.schema.inputObjectTypes.prisma.forEach(({ name }) => {
      this.inputTypeList.add(name);
    });
    this.modelsList = this.dmmf.datamodel.models.map(({ name }) => name);
  }

  getEnumImports({
    enumImports,
    field: { location, type },
  }: {
    enumImports: Set<string>;
    field: {
      location: DMMF.FieldLocation;
      type: DMMF.ArgType;
    };
  }): Set<string> {
    if (location === "enumTypes") {
      enumImports.add(this.getEnumName(type));
    }

    return enumImports;
  }

  // eslint-disable-next-line class-methods-use-this
  getEnumName(type: DMMF.ArgType): string {
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

  getJsonImports({
    field: { location, type },
    jsonImports,
    tsType,
  }: {
    field: {
      location: DMMF.FieldLocation;
      type: DMMF.ArgType;
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

    this.modelsList.forEach((model) => {
      if (input.startsWith(model)) {
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
      tsType: this._parseTSFieldType({
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

  private _parseTSFieldType({
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
}
