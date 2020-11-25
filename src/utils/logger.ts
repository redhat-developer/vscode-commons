const doLog: boolean = true;

// This exists only for testing purposes. Could delete later.
export namespace Logger {
  export function log(s: number | string | boolean | undefined): void {
    if (doLog) {
      console.log(s);
    }
  }
}
