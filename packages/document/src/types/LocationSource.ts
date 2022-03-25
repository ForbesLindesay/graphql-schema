type LocationSource =
  | {
      readonly kind: 'StringLocationSource';
      readonly source: string;
    }
  | {
      readonly kind: 'FileLocationSource';
      readonly filename: string;
      readonly source: string;
    }
  | {readonly kind: 'SchemaLocationSource'};
export default LocationSource;
