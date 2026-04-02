export interface IResponseMessage {
  validator?: {
    fails: string;
  };
  success: string;
  forbidden?: string;
}

// this declaration make IDE not occur error when we add dynamic fields to Request object
// ref: https://stackoverflow.com/questions/54195983/typesafe-express-middleware-and-routes
declare module 'express-serve-static-core' {
  interface Request {
    user: {
      id?: string;
      chat_user_id?: string;
      username?: string;
      staffRole?: string;
      email?: string;
    };
  }
  /**
   * Extend the Response interface of express-serve-static-common module.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Response {
    responseMessage?: IResponseMessage;
  }
}
