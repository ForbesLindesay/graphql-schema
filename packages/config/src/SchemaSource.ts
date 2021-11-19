import * as ft from 'funtypes';

export const SchemaSourceFileSchema = ft.Named(
  `SchemaSourceFile`,
  ft.Object({
    mode: ft.Literal(`FILE`),
    filename: ft.String,
    federated: ft.Union(ft.Boolean, ft.Undefined),
  }),
);

export const SchemaSourceSchema = SchemaSourceFileSchema;
