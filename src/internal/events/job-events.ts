export class JobDeleteVideosEvent {
  videoIds: string[];
  userId?: string;
}

export class JobMarkVideosHasBeenUsedEvent {
  videoIds: string[];
  userId?: string;
}

export class JobDeleteFilesEvent {
  fileIds: string[];
  userId?: string;
}

export class JobMarkFilesHasBeenUsedEvent {
  fileIds: string[];
  userId?: string;
}
