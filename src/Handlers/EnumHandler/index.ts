import type { Enum } from "../../types";
import { NestJSTypes } from "../../types";
import { BaseHandler } from "../BaseHandler";
import { compareObjectValues } from "../BaseHandler/compareFunctions";

export class EnumHandler extends BaseHandler {
  private readonly _enums: Enum[] = [];

  async createBarrelFile(): Promise<void> {
    if (this._enums.length) {
      const sourceFile = this.baseFileGenerator.createSourceFile(`${this.config.paths.enum}/index`);

      sourceFile.addExportDeclarations(
        this._enums.map(({ name }) => {
          return {
            moduleSpecifier: `./${name}`,
            namedExports: [name],
          };
        })
      );
      await sourceFile.save();
    }
  }

  async createFiles(): Promise<void> {
    // eslint-disable-next-line no-restricted-syntax
    for (const { documentation, name: enumName, values } of this._enums) {
      const sourceFile = this.baseFileGenerator.createSourceFile(`${this.config.paths.enum}/${enumName}`);

      this.baseFileGenerator.addNestJSImports({ nestJSImports: [NestJSTypes.RegisterEnumType], sourceFile });

      sourceFile.addEnum({
        isExported: true,
        members: values.map((data) => {
          return {
            name: data.name,
            value: data.value,
          };
        }),
        name: enumName,
      });

      sourceFile.addStatements((writer) =>
        writer
          .writeLine("")
          .writeLine(`${NestJSTypes.RegisterEnumType}(${enumName}, {`)
          .writeLine(`name: "${enumName}",`)
          .conditionalWrite(typeof documentation === "string", `description: "${documentation}"`)
          .writeLine("});")
      );

      sourceFile.formatText();
    }

    await this.baseFileGenerator.save();
  }

  parse(): void {
    this.baseParser.dmmf.datamodel.enums.forEach(({ documentation, name, values }): void => {
      this._enums.push({
        documentation,
        name: this.baseParser.getEnumName(name),
        values: values.map(({ name: value }) => {
          return { name: value, value };
        }),
      });
    });

    this.baseParser.dmmf.schema.enumTypes.prisma.forEach(({ name, values }): void => {
      this._enums.push({
        name: this.baseParser.getEnumName(name),
        values: values.map((value) => {
          return { name: value, value };
        }),
      });
    });

    this._enums.sort((a, b) => compareObjectValues({ a, b, field: "name" }));
  }
}
