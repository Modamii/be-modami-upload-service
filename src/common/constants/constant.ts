export const AN_HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
export const DEFAULT_MAX_AGE_NOT_USE_FILE_IN_HOUR = 4;

// https://stackoverflow.com/questions/47680711/which-http-errors-should-never-trigger-an-automatic-retry
export const STATUS_NOT_RETRY = [
  400, 401, 402, 403, 405, 406, 407, 409, 410, 411, 412, 413, 414, 415, 416,
  417, 418, 421, 422, 423, 424, 426, 428, 429, 431, 451,
];
