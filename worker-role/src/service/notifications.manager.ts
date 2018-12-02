import { DbConnection } from "./db.connection";
import { RowDataPacket } from 'mysql';
import { generate } from 'shortid';

export class NotificationsManager {

    public sendNotifications(userId: string, notificationText: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // Get friends of user
            this.dbConnection.getConnection()
                .query('SELECT * from friends WHERE peer1 = ? OR peer2 = ?', [userId, userId],
                    (err, data: RowDataPacket[]) => {
                        if (err) {
                            console.error('Failed to send notifications: ', err);
                            reject('Failed to send notifications: ' + err.message);
                            return;
                        }

                        if (data.length === 0) {
                            console.error('The user has no friends, or doesnt exist');
                            resolve();
                        }

                        const promises: Promise<void>[] = [];
                        data.forEach(friend => {
                            const toUser = (friend.peer1 === userId ? friend.peer2 : friend.peer1);
                            promises.push(new Promise<void>((resolve, reject) => {
                                this.dbConnection.getConnection()
                                    .query('INSERT into notifications VALUES (?,?,?,?,?)',
                                        [generate(), userId, toUser, String(new Date().getTime()), notificationText],
                                        (err, data) => {
                                            if (err) {
                                                console.error('Failed to insert values into friend: ', err);
                                                reject(err.message);
                                            }
                                        });
                            }));
                        });

                        Promise.all(promises).then((data) => {
                            console.log('Successfully completed adding notifications to all friends');
                            resolve();
                        }).catch(err => {
                            console.error('At least one of the updates have failed: ', err);
                            reject(err);
                        });
                    });
        })
    }

    private dbConnection: DbConnection = new DbConnection();
}