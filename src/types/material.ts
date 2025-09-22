interface MaterialMetadata {
  id?: string;
  fileName: string;
  originalName: string;
  storagePath: string;
  downloadUrl: string;
  userId: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'completed' | 'error';
  path: string;
  tags?: string[];
  createdAt?: Date;
}

export type { MaterialMetadata };
