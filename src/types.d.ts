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

const enum NestJSTypes {
  "ImportPath" = "@nestjs/graphql",
  "RegisterEnumType" = "registerEnumType",
}

export {
  Enum,
  EnumValue,
  // GeneratorConfig,
  // InputType,
  // TypeEnum,
  // Model,
  NestJSTypes,
  // OperationTypeEnum as OperationType,
  // OutputType,
  // ParserConstructorInput,
  // Resolver,
  // ResolverInputType,
};
