import { ImageDetails } from '../model/images.model';
import * as shortid from 'shortid';
import * as mysql from 'mysql2';
import { Connection, RowDataPacket } from 'mysql2';
import { Observable, Observer } from 'rxjs';
import { DbConnection } from './db.connection';

export class ImageManager {

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
            image.imageId = shortid.generate();
            try {
                image.imageTime = (new Date).getTime();
                this.dbConnection.getConnection().query('INSERT INTO images values (?,?,?,?,?)',
                    [image.userId, image.imageId, image.imageLoc, image.tag, image.imageTime],
                    (error, data) => {

                        if (error) {
                            console.log("Query failed: ", error);
                            throw error;
                        }
                    });

                console.log('User ', image.userId, ' created image: ', image.imageId);
                observer.next(image.imageId);
                observer.complete();
            } catch (error) {
                observer.error(error);
            }
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
            try {
                this.dbConnection.getConnection().query('DELETE FROM images WHERE userId=(?) AND imageId=(?)', [userId, imageId],
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

    public getAllImages(userId: string): Observable<ImageDetails[]> {
        if (!userId || userId === '') {
            throw 'UserId is required to retrive image';
        }

        return new Observable<ImageDetails[]>((observer: Observer<ImageDetails[]>) => {
            try {
                this.dbConnection.getConnection().query('SELECT * FROM images WHERE userid=(?)', [userId],
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

    private dbConnection: DbConnection = new DbConnection();
}
