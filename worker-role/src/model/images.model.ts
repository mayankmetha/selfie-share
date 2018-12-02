export interface ImageDetails {
    userId: string;
    imageId?: string;
    imageLoc: string;
    tag?: string;
    imageTime: number;
}

export interface SharedImage {
    imageId: string;
    sharedBy: string;
    sharedWith: string;
    sharedDate: string;
}

export interface ImageUploadResponse {
    imageUrl: string;
}