type LocationSource =
  | {
      readonly kind: 'FileLocationSource';
      readonly filename: string;
      readonly source: string;
    }
  | {readonly kind: 'SchemaLocationSource'};
export default LocationSource;
