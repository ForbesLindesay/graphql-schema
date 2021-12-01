import LocationSource from './LocationSource';

interface LocationRange {
  readonly kind: 'LocationRange';
  readonly source: LocationSource;
  /**
   * The character offset at which this Node begins.
   */
  readonly start: number;

  /**
   * The character offset at which this Node ends.
   */
  readonly end?: number;
}

type Location = LocationRange | LocationSource;
export default Location;
