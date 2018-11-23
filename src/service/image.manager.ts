import { ImageDetails, SharedImage } from '../model/images.model';
import * as shortid from 'shortid';
import * as mysql from 'mysql2';
import { Observable, Observer, forkJoin } from 'rxjs';
import { DbConnection } from './db.connection';
import { AWS } from './aws.service';
import * as fs from 'fs';

export class ImageManager {

    public constructor() {
        this.dbConnection = new DbConnection();
        this.awsInstance = new AWS();
    }
    /**
     * Inserts an image into the DB. If the image exists, throws an error.
     * Returns a unique id for the image.
     * @param image 
     */
    public createImage(image: ImageDetails): Observable<string> {
        if (!image || !image.userId || image.userId === '') {
            throw 'The userId for this image cannot be empty';
        }

        if (!image.imageLoc || image.imageLoc === '') {
            throw 'Image location cannot be empty';
        }

        if (!image.imageTime || image.imageTime === null) {
            throw 'Image timestamp cannot be empty';
        }

        return new Observable<string>((observer: Observer<string>) => {
            const imageId = shortid.generate();
            image.imageId = imageId;
            this.awsInstance.S3UploadFile(image.imageLoc, image.userId, image.imageId)
                .then((imageLoc: string) => {

                    console.log('Uploading to AWS: ', imageLoc);
                    if (!imageLoc || imageLoc === '') {
                        observer.error('Image upload failed');
                        return;
                    }

                    try {
                        const fileName = image.imageLoc;
                        image.imageTime = (new Date).getTime();
                        image.imageLoc = imageLoc;
                        this.dbConnection.getConnection().query('INSERT INTO images values (?,?,?,?,?)',
                            [image.userId, image.imageId, image.imageLoc, image.tag, image.imageTime],
                            (error, data) => {
                                if (error) {
                                    console.log("Query failed: ", error);
                                    observer.error('Query failed: ' + error.message);
                                    return;
                                }

                                console.log('User ', image.userId, ' created image: ', image.imageId);
                                observer.next(imageId);
                                observer.complete();
                            });
                        fs.unlink(fileName, (err) => {
                            if (err) {
                                console.warn('Local file deletion failed: ', err);
                            }
                        });
                    } catch (error) {
                        observer.error(error);
                    }

                })
                .catch(error => {
                    console.error('Failed to upload the file : ', error);
                    observer.error('Failed to upload file: ' + error);
                });

        });
    }

    public deleteImage(userId: string, imageId: string): Observable<string> {
        if (!userId || userId === '') {
            throw 'UserId is required to delete image';
        }

        if (!imageId || imageId === '') {
            throw 'ImageId is required to delete image';
        }

        return new Observable<string>((observer: Observer<string>) => {
            //const status = this.awsInstance.S3DeleteFile(userId+'_'+imageId);
            //if(!status) {
            //    throw 'File deletion failed';
            //}
            try {
                this.dbConnection.getConnection()
                    .query('DELETE FROM images WHERE userId=(?) AND imageId=(?)', [userId, imageId],
                        (error, data) => {

                            if (error) {
                                console.log("Query failed: ", error);
                                throw error;
                            }
                        });

                console.log('User ', userId, ' deleted image: ', imageId);
                observer.next(userId);
                observer.complete();
            } catch (error) {
                observer.error(error);
            }
        });
    }

    public getUsersWithWhomImageHasBeenShared(userId: string, imageId: string): Observable<string[]> {
        return new Observable<string[]>((observer: Observer<string[]>) => {
            if (!userId || userId === '') {
                observer.error('Invalid: The user id cannot be empty');
                return;
            }

            if (!imageId || imageId === '') {
                observer.error('Invalid: ImageId is required');
                return;
            }

            this.dbConnection.getConnection()
                .query('SELECT * FROM shared_images WHERE imageId = ? AND sharedBy = ?', [imageId, userId],
                    (error, result: mysql.RowDataPacket[]) => {
                        if (error) {
                            console.error('Failed to get list of users: ', error);
                            observer.error('Failed to get list of users: ' + error.message);
                            return;
                        }

                        const userIds: string[] = [];
                        result.forEach(result => {
                            userIds.push(result.sharedWith);
                        });
                        console.log('The image ', imageId, ' has been shared with users: ', userIds);

                        observer.next(userIds);
                        observer.complete();
                    });
        })
    }

    public getAllImages(userId: string): Observable<ImageDetails[]> {
        if (!userId || userId === '') {
            throw 'UserId is required to retrive image';
        }

        return new Observable<ImageDetails[]>((observer: Observer<ImageDetails[]>) => {
            try {
                this.dbConnection.getConnection().query('SELECT * FROM images WHERE userId=(?)', [userId],
                    (error, data: mysql.RowDataPacket[]) => {
                        if (error) {
                            throw error;
                        }
                        const imageDetails: ImageDetails[] = [];
                        for (let i = 0; i < data.length; ++i) {
                            const image = data[i];
                            imageDetails.push(<ImageDetails>{
                                userId: image.userId,
                                imageId: image.imageId,
                                imageLoc: image.imageLoc,
                                tag: image.tag,
                                imageTime: image.imageTime
                            });
                        }
                        observer.next(imageDetails);
                        observer.complete();
                    });
            } catch (error) {
                observer.error(error);
            }
        });
    }

    public getImage(imageId: string): Observable<ImageDetails> {
        return new Observable<ImageDetails>((observer: Observer<ImageDetails>) => {
            if (!imageId || imageId === '') {
                observer.error('The image id cannot be empty');
                return;
            }

            try {
                this.dbConnection.getConnection().query('SELECT * FROM images WHERE imageId=(?)', imageId,
                    (error, data: mysql.RowDataPacket[]) => {
                        if (error) {
                            console.error('Failed to get image: ', imageId, ': ', error);
                            observer.error(error.message);
                            return;
                        }

                        if (data.length !== 1) {
                            console.error('Too many or too few images returned: ', data.length);
                            observer.error('Image not found');
                            return;
                        }

                        const image = data[0];
                        observer.next(<ImageDetails>{
                            userId: image.userId,
                            imageId: image.imageId,
                            imageLoc: image.imageLoc,
                            tag: image.tag,
                            imageTime: image.imageTime
                        });
                        observer.complete();
                    });
            } catch (error) {
                observer.error(error);
            }

        });
    }

    public getImagesSharedWithUser(owner: string, displayName: string): Observable<ImageDetails[]> {
        return new Observable<ImageDetails[]>((observer: Observer<ImageDetails[]>) => {

            if (!owner || owner === '') {
                observer.error('Invalid: The user name cannot be empty');
                return;
            }
            if (!displayName || displayName === '') {
                observer.error('Invalid: The user name cannot be empty');
                return;
            }

            // Get all images which have been shared with this user.
            this.dbConnection.getConnection()
                .query('SELECT * from shared_images WHERE sharedBy = ? AND sharedWith = ?', [owner, displayName],
                    (error, data: mysql.RowDataPacket[]) => {
                        if (error) {
                            console.error('Failed to get images shared with user ', error);
                            observer.error('Failed to get shared images: ' + error.message);
                            return;
                        }

                        console.log('Found ', data.length, ' images shared with user ', displayName);
                        if (data.length === 0) {
                            observer.next([]);
                            observer.complete();
                        }

                        const imageObs: Observable<ImageDetails>[] = [];
                        data.forEach((shImg) => {
                            imageObs.push(this.getImage(shImg.imageId));
                        });

                        forkJoin(imageObs).subscribe((images: ImageDetails[]) => {
                            console.log('Found ', images.length, ' images');
                            observer.next(images);
                            observer.complete();
                        }, error => {
                            observer.error('Failed to fetch images: ' + error);
                        });
                    });
        });
    }

    public getImagesSharedByUser(owner: string, displayName: string): Observable<ImageDetails[]> {
        return new Observable<ImageDetails[]>((observer: Observer<ImageDetails[]>) => {

            if (!owner || owner === '') {
                observer.error('Invalid: The user name cannot be empty');
                return;
            }

            if (!displayName || displayName === '') {
                observer.error('Invalid: The user name cannot be empty');
                return;
            }

            // Get all images which have been shared with this user.
            this.dbConnection.getConnection()
                .query('SELECT * from shared_images WHERE sharedBy = ? AND sharedWith = ?', [displayName, owner],
                    (error, data: mysql.RowDataPacket[]) => {
                        if (error) {
                            console.error('Failed to get images shared with user ', error);
                            observer.error('Failed to get shared images: ' + error.message);
                            return;
                        }

                        console.log('Found ', data.length, ' images shared with user ', displayName);

                        if (data.length === 0) {
                            observer.next([]);
                            observer.complete();
                        }

                        const imageObs: Observable<ImageDetails>[] = [];
                        data.forEach((shImg) => {
                            imageObs.push(this.getImage(shImg.imageId));
                        });

                        forkJoin(imageObs).subscribe((images: ImageDetails[]) => {
                            console.log('Found ', images.length, ' images');
                            observer.next(images);
                            observer.complete();
                        }, error => {
                            observer.error('Failed to fetch images: ' + error);
                        });
                    });
        });
    }

    public shareImagesWithUser(owner: string, targetUser: string, imageIds: string[]): Observable<void> {
        return new Observable<void>((observer: Observer<void>) => {

            if (!owner || owner === '') {
                observer.error('Invalid: The owner of the image cannot be empty');
                return;
            }

            if (!targetUser || targetUser === '') {
                observer.error('Invalid: The target user cannot be empty');
                return;
            }

            if (!imageIds || imageIds.length === 0) {
                observer.error('Invalid: At least one image is expected');
                return;
            }

            // Ensure owner owns each image
            this.getAllImages(owner).subscribe((images: ImageDetails[]) => {
                const ownedImages: string[] = [];
                images.forEach((image: ImageDetails) => {
                    ownedImages.push(image.imageId ? image.imageId : '');
                });

                const unownedImages = imageIds.filter(imageId => {
                    return ownedImages.indexOf(imageId) < 0;
                });

                if (unownedImages.length !== 0) {
                    console.error('Found ', unownedImages.length, ' images which dont belong to user ', owner);
                    observer.error('Invalid: Found ' + unownedImages.length + ' images which dont belong to user ' + owner);
                    return;
                }

                const sharedDate = new Date().getTime();
                const promises: Promise<void>[] = [];
                imageIds.forEach((image: string) => {
                    promises.push(new Promise((resolve, reject) => {
                        this.dbConnection.getConnection()
                            .query('INSERT into shared_images values (?,?,?,?)', [image, owner, targetUser, sharedDate],
                                (error, data) => {
                                    if (error) {
                                        console.error('Failed to insert image ', image, ': ', error);
                                        reject('Failed to insert image ' + image + ': ' + error.message);
                                        return;
                                    }
                                    console.log('Successfully shared image ', image, ' with user ', targetUser, ' for owner ', owner);
                                    resolve();
                                });
                    }));
                });

                Promise.all(promises)
                    .then(() => {
                        console.log('All images shared!');
                        observer.next(undefined);
                        observer.complete();
                    })
                    .catch(error => {
                        console.error('Failed to share some images: ', error);
                        observer.error(error);
                    });
            }, error => {
                console.error('Error fetching images for user: ', error);
                observer.error(error);
            });
        });
    }

    public unshareImageWithUser(owner: string, targetUser: string, imageId: string): Observable<void> {
        return new Observable<void>((observer: Observer<void>) => {
            if (!owner || owner === '') {
                observer.error('Invalid: The owner of the image cannot be empty');
                return;
            }

            if (!targetUser || targetUser === '') {
                observer.error('Invalid: The target user cannot be empty');
                return;
            }

            if (!imageId || imageId.length === 0) {
                observer.error('Invalid: Image Id is invalid');
                return;
            }

            this.getImage(imageId).subscribe(async (image: ImageDetails) => {
                if (image.userId !== owner) {
                    console.error('User ', owner, ' does not own image ', imageId);
                    observer.error('User ' + owner + ' does not own image ' + imageId);
                    return;
                }

                const shared: ImageDetails[] = await this.getImagesSharedWithUser(owner, targetUser).toPromise();
                const isShared = shared.filter(tmpImg => {
                    return tmpImg.imageId === imageId;
                });

                if(isShared.length === 0) {
                    observer.error('The image is not shared between the users');
                    return;
                }

                this.dbConnection.getConnection()
                    .query('DELETE FROM shared_images where imageId = ? AND sharedBy = ? AND sharedWith = ?',
                        [imageId, owner, targetUser],
                        (error, data) => {
                            if (error) {
                                console.error('Failed to unshare image: ', error);
                                observer.error('Failed to unshare image: ' + error.message);
                                return;
                            }

                            observer.next(undefined);
                            observer.complete();
                        });
            }, error => {
                console.error('Failed to get image ', imageId, ': ', error);
                observer.error('Failed to get image ' + imageId + ': ' + error);
            });
        });
    }

    private dbConnection: DbConnection;
    private awsInstance: AWS;
}
