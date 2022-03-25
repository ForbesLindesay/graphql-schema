import {diffLinesUnified2} from 'jest-diff';
import prettyFormat from 'pretty-format';

export function diffObjects({actual, expected}: {actual: any; expected: any}) {
  const actualString = prettyFormat(actual);
  const expectedString = prettyFormat(expected);
  if (actualString === expectedString) {
    return {equal: true as const};
  } else {
    return {
      equal: false as const,
      printSummary: () => {
        console.error(
          diffLinesUnified2(
            expectedString.split('\n'),
            actualString.split('\n'),
            expectedString.split('\n'),
            actualString.split('\n'),
            {expand: false, contextLines: 5},
          ),
        );
      },
      printExpanded: () => {
        console.error(
          diffLinesUnified2(
            expectedString.split('\n'),
            actualString.split('\n'),
            expectedString.split('\n'),
            actualString.split('\n'),
          ),
        );
      },
    };
  }
}
