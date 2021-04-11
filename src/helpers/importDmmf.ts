/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
import type { DMMF } from "@prisma/generator-helper";

export const importDmmf = (prismaClientImportPath: string): DMMF.Document =>
  require(prismaClientImportPath).dmmf as DMMF.Document;
