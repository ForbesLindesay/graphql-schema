import {ObjectResolversConfig} from '@graphql-schema/build-typescript-server-types';
import * as ft from 'funtypes';

export const ObjectResolversConfigSchema: ft.Runtype<ObjectResolversConfig> = ft.Named(
  `ObjectResolversConfig`,
  ft.Object({
    contextType: ft.String,
    helpersName: ft.String,
    allowUndefinedAsNull: ft.Boolean,
    useReadonlyArrays: ft.Boolean,
  }),
);
