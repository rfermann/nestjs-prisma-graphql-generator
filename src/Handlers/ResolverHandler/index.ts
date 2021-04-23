import type { DMMF } from "@prisma/client/runtime";
import type { DecoratorStructure, OptionalKind, ParameterDeclarationStructure } from "ts-morph";
import { Scope, StructureKind } from "ts-morph";

import type { Enum, Resolver } from "../../types";
import { NestJSTypes, ObjectTypes, OperationType, TypeEnum } from "../../types";
import type { HandlerOptions } from "../BaseHandler";
import { BaseHandler } from "../BaseHandler";

const getOperationKey = <T, TK extends keyof T>(obj: T, key: TK): T[TK] => obj[key];

export class ResolverHandler extends BaseHandler {
  private readonly _operationsMapping: Record<string, string> = {};

  private readonly _resolvers: Resolver[] = [];

  // disable groupBy until https://github.com/prisma/prisma/issues/6494 is solved
  private readonly _restrictedOperations = ["groupBy"];

  constructor(args: HandlerOptions) {
    super(args);

    this.baseParser.dmmf.mappings.modelOperations.forEach((modelOperation) => {
      Object.keys(modelOperation).forEach((key) => {
        const operationKey = getOperationKey(modelOperation, key as keyof DMMF.ModelMapping);

        if (typeof operationKey === "string") {
          this._operationsMapping[operationKey] = key;
        }
      });
    });
  }

  // eslint-disable-next-line max-lines-per-function
  async createFiles(): Promise<void> {
    this._resolvers.forEach(
      // eslint-disable-next-line max-lines-per-function
      ({
        graphQLType,
        inputType,
        inputTypeImports,
        isNullable,
        model,
        name,
        operation,
        operationType,
        resolverName,
        returnType,
      }) => {
        const path = model || `${this.config.paths.shared}`;

        const sourceFile = this.baseFileGenerator.createSourceFile(
          `${path}/${this.config.paths.resolvers}/${resolverName}`
        );

        const isAggregation = operation === "aggregate";
        let outputType = "";
        let aggregateType = "";

        if (returnType.includes("[]")) {
          [outputType] = returnType.split("[]");
        } else if (returnType.includes("|")) {
          [outputType] = returnType.split(" | ");
        } else {
          outputType = returnType;
        }

        const isBatchOperation = outputType === "AffectedRowsOutput";

        this.baseFileGenerator.addNestJSImports({
          nestJSImports: [NestJSTypes.Args, operationType, ObjectTypes.Resolver],
          sourceFile,
        });

        if (this.config.includePrismaSelect && !isBatchOperation) {
          this.baseFileGenerator.addNestJSImports({
            nestJSImports: [NestJSTypes.Info],
            sourceFile,
          });

          sourceFile.addImportDeclaration({
            moduleSpecifier: "@paljs/plugins",
            namedImports: ["PrismaSelect"],
          });

          sourceFile.addImportDeclaration({
            moduleSpecifier: "graphql",
            namedImports: ["GraphQLResolveInfo"],
          });
        }

        sourceFile.addImportDeclaration({
          moduleSpecifier: this.config.prismaServiceImportPath,
          namedImports: [this.config.prismaServiceImport],
        });

        this.baseFileGenerator.addModelImports({
          models: [model],
          sourceFile,
          type: TypeEnum.Resolver,
        });

        if (inputTypeImports && inputTypeImports.length > 0) {
          this.baseFileGenerator.addInputTypeImports({
            isResolver: true,
            model,
            sourceFile,
            types: inputTypeImports,
          });
        }

        if (this._getResolverName(outputType) !== name) {
          this.baseFileGenerator.addOutputTypeImports({
            isResolver: true,
            model,
            sourceFile,
            types: [outputType],
          });
        }

        if (isAggregation) {
          aggregateType = `Prisma.Get${model}AggregateType<${inputType}>`;
          sourceFile.addImportDeclaration({
            moduleSpecifier: "@prisma/client",
            namedImports: [`Prisma`],
          });
        }

        const addedClass = sourceFile.addClass({
          ctors: [
            {
              parameters: [
                {
                  name: "prismaService",
                  type: this.config.prismaServiceImport,
                },
              ],
              statements: ["this._prismaService = prismaService;"],
            },
          ],
          decorators: this.baseFileGenerator.getClassDecorator({
            decoratorType: ObjectTypes.Resolver,
            isAbstract: false,
            returnType: model,
          }),
          isExported: true,
          name: resolverName,
          properties: [
            {
              isReadonly: true,
              name: "_prismaService",
              scope: Scope.Private,
              type: this.config.prismaServiceImport,
            },
          ],
        });

        const parameters: ParameterDeclarationStructure[] = [
          {
            decorators: [
              {
                arguments: [`"${this.config.inputArgumentsName}", { nullable: true }`],
                kind: StructureKind.Decorator,
                name: NestJSTypes.Args,
              },
            ],
            kind: StructureKind.Parameter,
            name: this.config.inputArgumentsName,
            type: inputType,
          },
        ];

        if (this.config.includePrismaSelect && !isBatchOperation) {
          parameters.push({
            decorators: [
              {
                arguments: [],
                kind: StructureKind.Decorator,
                name: NestJSTypes.Info,
              },
            ],
            kind: StructureKind.Parameter,
            name: "info",
            type: "GraphQLResolveInfo",
          });
        }

        addedClass.addMethod({
          decorators: this._getMethodDecorator({ graphQLType, isNullable, operationType }),
          isAsync: true,
          name,
          parameters,
          returnType: (writer) =>
            writer
              .conditionalWrite(
                this.config.includePrismaSelect && !isAggregation,
                `Promise<${aggregateType || returnType.replace(outputType, `Partial<${outputType}>`)}>`
              )
              .conditionalWrite(
                !this.config.includePrismaSelect || isAggregation,
                `Promise<${aggregateType || returnType}>`
              ),
          statements: (writer) =>
            writer
              .conditionalWriteLine(
                this.config.includePrismaSelect && !isAggregation && !isBatchOperation,
                `const { select } = new PrismaSelect(info).value;`
              )
              .conditionalWriteLine(
                this.config.includePrismaSelect && isAggregation,
                `const { count } = new PrismaSelect(info).value;`
              )
              .conditionalWriteLine(
                this.config.includePrismaSelect && !isAggregation && !isBatchOperation,
                `return this._prismaService.${this._camelCase(model)}.${operation}({ select, ...${
                  this.config.inputArgumentsName
                } })`
              )
              .conditionalWriteLine(
                this.config.includePrismaSelect && isAggregation,
                `return this._prismaService.${this._camelCase(model)}.${operation}({ count, ...${
                  this.config.inputArgumentsName
                } })`
              )
              .conditionalWriteLine(
                (!this.config.includePrismaSelect && !isAggregation) ||
                  (!this.config.includePrismaSelect && isAggregation) ||
                  isBatchOperation,
                `return this._prismaService.${this._camelCase(model)}.${operation}({ ...${
                  this.config.inputArgumentsName
                } })`
              ),
        });

        sourceFile.formatText();
        sourceFile.save();
      }
    );

    await this.baseFileGenerator.save();
  }

  // eslint-disable-next-line max-lines-per-function
  parse(_enums: Enum[]): void {
    const resolverGroups = this.baseParser.dmmf.schema.outputObjectTypes.prisma.filter(
      ({ name }) => name === OperationType.Mutation || name === OperationType.Query
    );

    resolverGroups.forEach(({ name: operationType, fields: resolvers }) => {
      resolvers
        .filter(({ name }) => {
          if (
            this.baseParser.dmmf.mappings.otherOperations.read.includes(name) ||
            this.baseParser.dmmf.mappings.otherOperations.write.includes(name)
          ) {
            return false;
          }

          return true;
        })
        .forEach(({ isNullable, name, outputType }) => {
          const model = this.baseParser.getModelName(name);
          const operation = this._operationsMapping[this._camelCase(name)];

          if (this._restrictedOperations.includes(operation)) {
            return;
          }

          const inputTypeImports: Set<string> = new Set();
          const inputType = this.baseParser.getInputTypeName(name);

          if (this.baseParser.inputTypeList.has(inputType)) {
            inputTypeImports.add(inputType);
          }

          const { isList, location, type } = outputType;
          const graphQLType = this.baseParser.parseGraphQLType([{ isList, location, type: type as string }]);

          this._resolvers.push({
            graphQLType,
            inputType,
            inputTypeImports: Array.from(inputTypeImports),

            isNullable: typeof isNullable === "boolean" ? isNullable : false,
            model: model as string,
            name,
            operation: this._operationsMapping[name],
            operationType: operationType as OperationType,
            resolverName: this._getResolverName(name),
            returnType: this.baseParser.parseTSFieldType({
              enums: [],
              field: {
                ...outputType,
              },
              fieldOptions: {
                isInputType: false,
                isRequired: false,
              },
            }),
          });
        });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  private _camelCase(word: string): string {
    return `${word.charAt(0).toLocaleLowerCase()}${word.slice(1)}`;
  }

  // eslint-disable-next-line class-methods-use-this
  private _getMethodDecorator({
    graphQLType,
    isNullable,
    operationType,
  }: {
    graphQLType: string;
    isNullable: boolean;
    operationType: OperationType;
  }): OptionalKind<DecoratorStructure>[] {
    return [
      {
        arguments: [
          (writer) => writer.writeLine(`() => ${graphQLType}, {`).writeLine(`nullable: ${isNullable}`).write("}"),
        ],
        name: operationType,
      },
    ];
  }

  private _getResolverName(name: string): string {
    return `${this.baseParser.pascalCase(name)}${TypeEnum.Resolver}`;
  }
}
