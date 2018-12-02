import { User, UserCreateRequest, Friends, ImageNotification } from '../model';
import * as mysql from 'mysql2';
import { Connection } from 'mysql2';
import { Observable, Observer } from 'rxjs';
import { DbConnection } from './db.connection';

export class UserManager {

    public constructor() {
        this.dbConnection = new DbConnection();
    }

    /**
     * Inserts a user into the DB. If the user exists, throws an error.
     * Returns a unique id for the user.
     * @param user 
     */
    public createUser(user: UserCreateRequest): Observable<void> {
        return new Observable<void>((observer: Observer<void>) => {

            if (!user || !user.email || user.email === '') {
                observer.error('The email for the user cannot be empty');
                return;
            }

            if (!user.displayName || user.displayName === '') {
                observer.error('The username cannot be empty');
                return;
            }

            if (!user.password || user.password.length < 4) {
                observer.error('Minimum Password length is 4');
                return;
            }

            this.getUser(user.displayName).subscribe(data => {
                console.error('Found duplicate user name');
                observer.error('Username already exists');
                return;
            }, error => {
                this.dbConnection.getConnection().query('INSERT INTO users values (?,?,?,?,?,?,?)',
                    [user.displayName, user.email, user.profilePicUrl, user.profession, user.description, user.age, 0],
                    (error) => {
                        if (error) {
                            observer.error(error.message);
                        } else {
                            console.log('Successfully created user: ', user.displayName);
                            observer.next(undefined);
                            observer.complete();
                        }
                    });
            });
        });
    }

    public getAllUsers(displayName?: string): Observable<User[]> {
        return new Observable<User[]>((observer: Observer<User[]>) => {
            this.dbConnection.getConnection().query('SELECT * FROM users', (error, data: mysql.RowDataPacket[]) => {
                if (error) {
                    observer.error(error.message);
                    return;
                }

                let users: User[] = [];
                for (let i = 0; i < data.length; ++i) {
                    const user = data[i];
                    users.push(<User>{
                        displayName: user.displayName,
                        email: user.email,
                        profilePicUrl: user.profilePicUrl,
                        profession: user.profession,
                        description: user.description,
                        age: user.age,
                        numberOfFriends: 0
                    });
                }

                if (displayName && displayName !== '') {
                    console.log('Filtering users by name: ', displayName);
                    const tmpUsers: User[] = [];
                    users.forEach((user: User) => {
                        if (user.displayName.toLowerCase().indexOf(displayName.toLowerCase()) >= 0) {
                            tmpUsers.push(user);
                        }
                    });
                    users = tmpUsers;
                }

                // Find friends for each of the users..how?

                observer.next(users);
                observer.complete();
            });
        });
    }

    public getUser(displayName: string): Observable<User> {
        return new Observable<User>((observer: Observer<User>) => {
            this.dbConnection.getConnection().query('SELECT * FROM users WHERE displayName = ?', displayName,
                (error, data: mysql.RowDataPacket[]) => {
                    if (error) {
                        console.log('Returning error');
                        observer.error(error.message);
                        return;
                    }

                    if (data.length !== 1) {
                        observer.error('User not found');
                        return;
                    }

                    this.getNumFriendsForUser(displayName)
                        .then(numFriends => {

                            const user = data[0];
                            observer.next(<User>{
                                displayName: user.displayName,
                                email: user.email,
                                profilePicUrl: user.profilePicUrl,
                                profession: user.profession,
                                description: user.description,
                                age: user.age,
                                numberOfFriends: numFriends
                            });
                            observer.complete();
                        })
                        .catch(error => {
                            observer.error(error);
                        })
                });
        });
    }

    public deleteUser(displayName: string): Observable<void> {
        return new Observable<void>((observer: Observer<void>) => {
            if (!displayName || displayName === '') {
                observer.error('The user name cannot be empty');
            } else {
                this.dbConnection.getConnection().query('DELETE FROM users WHERE displayName = ?', displayName, (error, data) => {
                    if (error) {
                        console.error('Failed to delete user ', displayName, ': ', error);
                        observer.error(error.message);
                    } else {
                        console.log('Successfully deleted user ', displayName);
                        observer.next(undefined);
                        observer.complete();
                    }
                });
            }
        });
    }

    private async getNumFriendsForUser(user: string): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            this.dbConnection.getConnection().query('SELECT COUNT(*) FROM friends where peer1 = ? OR peer2 = ?',
                [user, user], (error, data: mysql.RowDataPacket[]) => {
                    if (error) {
                        reject('Failed to find friends of user: ' + error.message);
                    } else {
                        resolve(Number(data[0]['COUNT(*)']));
                    }
                });
        });
    }

    public getFriendsForUser(displayName: string): Observable<Friends[]> {
        return new Observable<Friends[]>((observer: Observer<Friends[]>) => {
            // Check if user exists
            this.getUser(displayName).subscribe((user: User) => {
                this.dbConnection.getConnection().query('SELECT * from friends where peer1 = ? OR peer2 = ?'
                    , [displayName, displayName], (error, data: mysql.RowDataPacket[]) => {
                        if (error) {
                            console.error('Failed to get friends of user ' + displayName + ': ' + error);
                            observer.error('Failed to get friends of user ' + displayName + ': ' + error.message);
                            return;
                        }

                        console.log('Found ', data.length, ' friends for user ', displayName);
                        const friends: Friends[] = [];
                        data.forEach(friend => {
                            // Set peer1 always to current user
                            friends.push(<Friends>{
                                friendId: friend.friendId,
                                peer1: displayName,
                                peer2: ((displayName === friend.peer1) ? friend.peer2 : friend.peer1),
                                friendshipDate: this.getFormattedDate(friend.friendshipDate)
                            });
                        });

                        observer.next(friends);
                        observer.complete();
                    });
            }, error => {
                console.log('User ' + displayName + ' does not exist');
                observer.error(error);
            });

        });
    }

    public unfriendUsers(user1: string, user2: string): Observable<void> {
        return new Observable<void>((observer: Observer<void>) => {
            // Check if both are friends
            this.getFriendsForUser(user1).subscribe((friends: Friends[]) => {
                let areFriends = false;
                friends.forEach((friend: Friends) => {
                    if (friend.peer1 === user2 || friend.peer2 === user2) {
                        areFriends = true;
                    }
                });

                if (!areFriends) {
                    console.error('Users ', user1, ' and ', user2, ' are not friends');
                    observer.error('Users ' + user1 + ' and ' + user2 + ' are not friends');
                    return;
                }

                this.dbConnection.getConnection()
                    .query('DELETE FROM friends where (peer1 = ? AND peer2 = ?) OR (peer1 = ? AND peer2 = ?)',
                        [user1, user2, user2, user1], (error, data) => {
                            if (error) {
                                console.error('Failed to unfriend users: ', error);
                                observer.error('Failed to unfriend users: ' + error.message);
                            } else {
                                observer.next(undefined);
                                observer.complete();
                            }
                        });

            }, error => {
                console.log('Failed to unfriend users: ', error);
                observer.error('Failed to unfriend users: ' + error);
            })
        })
    }

    public getNotifications(user: string): Observable<ImageNotification[]> {
        return new Observable<ImageNotification[]>((observer: Observer<ImageNotification[]>) => {
            // Check if user exists
            this.getUser(user).subscribe(data => {
                console.log('Found user ', user);
                this.dbConnection.getConnection()
                    .query('SELECT * from notifications WHERE toUser = ?',
                        user, (error, data: mysql.RowDataPacket[]) => {
                            if (error) {
                                console.error('Failed to get notifications for user: ', error);
                                observer.error('Failed to get notifications for user: ' + error.message);
                            } else {
                                console.log('Found ', data.length, ' notifications for user ', user);
                                const notifications: ImageNotification[] = [];
                                data.forEach(notification => {
                                    // Set peer1 always to current user
                                    notifications.push(<ImageNotification>{
                                        date: notification.notificationDate,
                                        notificationFromUser: notification.fromUser,
                                        notificationToUser: notification.toUser,
                                        notificationId: notification.notificationId,
                                        notificationText: notification.notificationText
                                    });
                                });

                                observer.next(notifications);
                                observer.complete();
                            }
                        });
            }, error => {
                console.error('Failed to find user: ', user);
                observer.error('Not Found: Failed to find user: ' + error);
            });
        });
    }

    private getFormattedDate(millis: string): string {
        const date: Date = new Date(millis);
        return date.toDateString();
    }

    private dbConnection: DbConnection;
}