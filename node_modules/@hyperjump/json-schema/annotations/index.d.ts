import type { OutputFormat, Output, ValidationOptions } from "../lib/index.js";
import type { CompiledSchema } from "../lib/experimental.js";
import type { JsonNode } from "../lib/instance.js";
import type { Json } from "@hyperjump/json-pointer";


export const annotate: (
  (schemaUrl: string, value: Json, options?: OutputFormat | ValidationOptions) => Promise<JsonNode>
) & (
  (schemaUrl: string) => Promise<Annotator>
);

export type Annotator = (value: Json, options?: OutputFormat | ValidationOptions) => JsonNode;

export const interpret: (compiledSchema: CompiledSchema, value: JsonNode, options?: OutputFormat | ValidationOptions) => JsonNode;

export class ValidationError extends Error {
  public output: Output & { valid: false };

  public constructor(output: Output);
}
