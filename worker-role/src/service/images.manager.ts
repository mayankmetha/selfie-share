import { DbConnection } from "./db.connection";
import { RowDataPacket } from 'mysql';

export class ImageManager {


    public updateImageUrl(imageId: string, newUrl: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!imageId || imageId === ''
                || !newUrl || newUrl === '') {
                reject('Invalid parameters specified');
            } else {
                this.dbConnection.getConnection()
                    .query('UPDATE TABLE images set imageLoc = ? WHERE imageId = ?', [newUrl, imageId],
                        (err, data: RowDataPacket[]) => {
                            console.log('Successfully updated image url for image ', imageId, ' to ', newUrl);
                            resolve();
                        });
            }
        })
    }

    private dbConnection: DbConnection = new DbConnection();
}