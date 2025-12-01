export interface User {
  id: string
  email: string
  username: string
  role: 'ADMIN' | 'USER'
  createdAt?: Date
  updatedAt?: Date
}

export interface FileItem {
  id: string
  filename: string
  path: string
  mimeType: string
  size: number
  ownerId: string
  folderId?: string
  createdAt: Date
  updatedAt: Date
}

export interface FolderItem {
  id: string
  name: string
  path: string
  ownerId: string
  parentId?: string
  createdAt: Date
  updatedAt: Date
}

