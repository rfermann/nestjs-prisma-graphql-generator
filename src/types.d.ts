// eslint-disable-next-line import/no-unassigned-import
import "listr";

declare module "listr" {
  interface ListrOptions {
    collapse?: boolean;
  }
}

interface Enum {
  documentation?: string;
  name: string;
  values: EnumValue[];
}

interface EnumValue {
  name: string;
  value: string;
}

interface Field {
  documentation?: string;
  graphQLType: string;
  isNullable: boolean;
  isRequired: boolean;
  name: string;
  tsType: string;
}

interface InputType {
  enumImports?: string[];
  fields: Field[];
  graphqlScalarImports?: string[];
  jsonImports?: string[];
  modelImports?: string[];
  name: string;
  nestJSImports?: string[];
}

interface Model extends InputType {
  documentation: string | undefined;
}

const enum NestJSTypes {
  "Field" = "Field",
  "Float" = "Float",
  "GraphQLISODateTime" = "GraphQLISODateTime",
  "GraphQLTimestamp" = "GraphQLTimestamp",
  "ID" = "ID",
  "ImportPath" = "@nestjs/graphql",
  "Int" = "Int",
  "ObjectType" = "ObjectType",
  "RegisterEnumType" = "registerEnumType",
}

const enum TypeEnum {
  "InputType" = "InputType",
  "ModelType" = "ModelType",
  "OutputType" = "OutputType",
  "ResolverInputType" = "ResolverInputType",
}

export {
  Enum,
  EnumValue,
  Field,
  // GeneratorConfig,
  // InputType,
  Model,
  NestJSTypes,
  TypeEnum,
  // OperationTypeEnum as OperationType,
  // OutputType,
  // ParserConstructorInput,
  // Resolver,
  // ResolverInputType,
};
