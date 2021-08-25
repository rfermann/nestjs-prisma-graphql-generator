// eslint-disable-next-line import/no-nodejs-modules
import { StructureKind } from "ts-morph";

import type { InputType } from "../../types";
import { BaseHandler } from "../BaseHandler";
import { compareObjectValues } from "../BaseHandler/compareFunctions";

interface InputTypeDecorator {
  fields?: InputTypeDecorator[];
  name: string;
  type?: string;
}

export class InputTypeDecoratorHandler extends BaseHandler {
  private _inputTypeDecorators: InputTypeDecorator[] = [];

  async createFile(): Promise<void> {
    const file = this.baseFileGenerator.createSourceFile(`${this.config.paths.inputTypeDecorators}/index`);

    const inputTypeInterface = file.addInterface({
      isExported: true,
      name: "InputTypeDecorators",
    });

    this._inputTypeDecorators
      .sort((a, b) => compareObjectValues({ a, b, field: "name" }))
      .forEach(({ name, fields }) => {
        inputTypeInterface.addProperty({
          hasQuestionToken: true,
          kind: StructureKind.PropertySignature,
          name,
          type: (writer) => {
            if (fields?.length) {
              writer.writeLine("{");
              fields?.forEach((field) => {
                writer.writeLine(`${field.name}?: ${field.type};`);
              });
              writer.write("}");
            }
          },
        });
      });

    file.formatText();
    file.save();
  }

  parse(inputTypes: InputType[]): void {
    inputTypes.forEach(({ name, fields }) => {
      const newFields: InputTypeDecorator[] = [];

      fields.forEach((field) => {
        const type = this._getType(inputTypes, field.tsType);

        if (type) {
          newFields.push({
            name: field.name,
            type,
          });
        }
      });

      if (newFields.length > 0) {
        this._inputTypeDecorators.push({
          fields: newFields,
          name,
        });
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  private _getType(inputTypes: InputType[], tsType: string): string | undefined {
    const type = tsType.replace(" | undefined", "").replace("[]", "");
    const isPrismaType = inputTypes.find((predicate) => predicate.name === type);

    if (isPrismaType) {
      return undefined;
    }

    return "PropertyDecorator | PropertyDecorator[]";
  }
}
