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
  decorators?: Map<string, string>;
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
  inputTypeImports?: string[];
  jsonImports?: string[];
  modelImports?: string[];
  name: string;
  nestJSImports?: string[];
}

interface Model extends InputType {
  documentation: string | undefined;
}

const enum NestJSTypes {
  "Args" = "Args",
  "Field" = "Field",
  "Float" = "Float",
  "GraphQLISODateTime" = "GraphQLISODateTime",
  "GraphQLTimestamp" = "GraphQLTimestamp",
  "ID" = "ID",
  "ImportPath" = "@nestjs/graphql",
  "Info" = "Info",
  "Int" = "Int",
  "RegisterEnumType" = "registerEnumType",
}

const enum ObjectTypes {
  "InputType" = "InputType",
  "ObjectType" = "ObjectType",
  "Resolver" = "Resolver",
}

const enum OperationType {
  "Mutation" = "Mutation",
  "Query" = "Query",
}

interface OutputType extends InputType {
  outputTypeImports?: string[];
}

interface Resolver {
  graphQLType: string;
  inputType: string;
  inputTypeImports?: string[];
  isNullable: boolean;
  model: string;
  name: string;
  operation: string;
  operationType: OperationType;
  resolverName: string;
  returnType: string;
}

const enum TypeEnum {
  "InputType" = "InputType",
  "ModelType" = "ModelType",
  "OutputType" = "OutputType",
  "Resolver" = "Resolver",
  "ResolverInputType" = "ResolverInputType",
}

export {
  Enum,
  EnumValue,
  Field,
  // GeneratorConfig,
  InputType,
  Model,
  NestJSTypes,
  ObjectTypes,
  TypeEnum,
  OperationType,
  OutputType,
  // ParserConstructorInput,
  Resolver,
  // ResolverInputType,
};
