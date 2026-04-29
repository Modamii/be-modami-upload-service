export class JobDeleteFilesEvent {
  fileIds: string[];
  userId?: string;
}

export class JobMarkFilesHasBeenUsedEvent {
  fileIds: string[];
  userId?: string;
}
