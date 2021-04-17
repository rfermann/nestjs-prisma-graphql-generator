// eslint-disable-next-line import/no-nodejs-modules
import { existsSync, readFileSync, rmdirSync } from "fs";

import type { GeneratorConfig } from "../../GeneratorConfig";
import { importDmmf } from "../../helpers";
import { EnumHandler } from "../EnumHandler";

import { ModelHandler } from ".";

describe("ModelHandler", () => {
  // eslint-disable-next-line jest/no-hooks
  beforeAll(async () => {
    if (existsSync(`${process.cwd()}/fixtures/modelHandler/fixtures/`)) {
      rmdirSync(`${process.cwd()}/fixtures/modelHandler/fixtures/`, { recursive: true });
    }
  });
  it("should parse DMMF properly", async () => {
    expect.assertions(1);

    expect(true).toBe(true);
  });

  it("should parse models and create correct files from datamodel", async () => {
    expect.assertions(2);

    const config: GeneratorConfig = {
      basePath: `${process.cwd()}/fixtures/modelHandler/fixtures/output3`,
      paths: {
        enums: "enums",
        inputTypes: "",
        model: "model",
        shared: "",
      },
      prismaClientImportPath: `${process.cwd()}/node_modules/@prisma/client`,
    };

    const enumHandler = new EnumHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    const modelHandler = new ModelHandler({
      config,
      dmmf: importDmmf(config.prismaClientImportPath),
    });

    enumHandler.parse();

    modelHandler.parse(enumHandler.getEnums());
    await modelHandler.createFiles();

    const userModelFile = readFileSync(`${config.basePath}/User/model.ts`, "utf-8");
    const sessionModelFile = readFileSync(`${config.basePath}/Session/model.ts`, "utf-8");

    // eslint-disable-next-line jest/prefer-inline-snapshots
    expect(userModelFile).toMatchSnapshot();

    expect(sessionModelFile).toMatchInlineSnapshot(`
      "import { Field, GraphQLISODateTime, Int, ObjectType } from \\"@nestjs/graphql\\";
      import { ByteResolver } from \\"graphql-scalars\\";
      import { User } from \\"../User/model\\";

      @ObjectType({
        isAbstract: true,
      })
      export class Session {
        @Field(() => Int, {
          nullable: false
        })
        id!: number;

        @Field(() => GraphQLISODateTime, {
          nullable: false
        })
        createdAt!: Date;

        @Field(() => User, {
          nullable: true
        })
        user?: User | null;

        @Field(() => Int, {
          nullable: false
        })
        userId!: number;

        @Field(() => Decimal, {
          nullable: false
        })
        size!: number;

        @Field(() => BigInt, {
          nullable: false
        })
        bigSize!: bigint;

        @Field(() => ByteResolver, {
          nullable: false
        })
        byte!: Buffer;
      }
      "
    `);
  });
});
