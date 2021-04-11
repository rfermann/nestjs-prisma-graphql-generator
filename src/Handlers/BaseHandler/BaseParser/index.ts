import type { DMMF } from "@prisma/generator-helper";

export class BaseParser {
  readonly dmmf: DMMF.Document;

  constructor(dmmf: DMMF.Document) {
    this.dmmf = dmmf;
  }

  // eslint-disable-next-line class-methods-use-this
  getEnumName(name: string): string {
    return `${name.replace("Enum", "")}Enum`;
  }
}
