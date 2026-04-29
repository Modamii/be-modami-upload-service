export class JobDeleteFilesDto {
  fileIds: string[];
  userId?: string;
}

export class JobMarkFilesHasBeenUsedDto {
  fileIds: string[];
  userId?: string;
}
