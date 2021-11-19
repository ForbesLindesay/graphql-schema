import {ScalarResolversConfig} from '@graphql-schema/build-typescript-server-types';
import * as ft from 'funtypes';

export const ScalarResolversConfigSchema: ft.Runtype<ScalarResolversConfig> = ft.Named(
  `ScalarResolversConfig`,
  ft.Object({
    interfaceName: ft.String,
    methodName: ft.String,
    useOptionalProps: ft.Boolean,
  }),
);
