// BS: modami stream (modami feed)
export class BSVideoPostHasBeenCreatedDto {
  postId?: string;
  videoIds: string[];
}

export class JobDeleteVideosDto {
  videoIds: string[];
  userId?: string;
}

export class JobMarkVideosHasBeenUsedDto {
  videoIds: string[];
  userId?: string;
}

export class JobDeleteFilesDto {
  fileIds: string[];
  userId?: string;
}

export class JobMarkFilesHasBeenUsedDto {
  fileIds: string[];
  userId?: string;
}
