import {FieldTypeOptions} from '@graphql-schema/build-typescript-declarations';
import * as ft from 'funtypes';

export const InputObjectConfigSchema: ft.Runtype<
  Pick<
    FieldTypeOptions,
    | 'useReadonlyProps'
    | 'useReadonlyArrays'
    | 'allowUndefinedAsNull'
    | 'makeNullablePropertiesOptional'
  >
> = ft.Named(
  `InputObjectConfig`,
  ft.Object({
    useReadonlyArrays: ft.Boolean,
    useReadonlyProps: ft.Boolean,
    allowUndefinedAsNull: ft.Boolean,
    makeNullablePropertiesOptional: ft.Boolean,
  }),
);
