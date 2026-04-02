export interface IException {
  customCode?: string; // HTTP_STATUS_ID
  message?: string; // Message to be display to the end user without debugging information
  detailedError?: string; // Internal error string to help the developer
  requestId?: string; // The RequestId that's also set in the header
  statusCode?: number; // The http status code
  params?: {};
  stack?: string;
}
