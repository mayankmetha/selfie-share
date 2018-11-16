import { User, UserCreateRequest, Friends } from '../model';
import * as mysql from 'mysql2';
import { Connection } from 'mysql2';
import { Observable, Observer } from 'rxjs';
import * as fs from 'fs';

export class UserManager {

    public constructor() {
        this.dbConfig = JSON.parse(fs.readFileSync(__dirname + '/../dbconfig.json', 'UTF-8'));
        this.connection = mysql.createConnection(<mysql.ConnectionOptions>{
            host: this.dbConfig.host,
            user: this.dbConfig.user,
            password: this.dbConfig.password,
            database: this.dbConfig.database
        });
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
                this.connection.query('INSERT INTO users values (?,?,?,?,?,?,?)',
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
            this.connection.query('SELECT * FROM users', (error, data: mysql.RowDataPacket[]) => {
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
            this.connection.query('SELECT * FROM users WHERE displayName = ?', displayName,
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
                this.connection.query('DELETE FROM users WHERE displayName = ?', displayName, (error, data) => {
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
            this.connection.query('SELECT COUNT(*) FROM friends where peer1 = ? OR peer2 = ?',
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
                this.connection.query('SELECT * from friends where peer1 = ? OR peer2 = ?'
                    , [displayName, displayName], (error, data: mysql.RowDataPacket[]) => {
                        if (error) {
                            console.error('Failed to get friends of user ' + displayName + ': ' + error);
                            observer.error('Failed to get friends of user ' + displayName + ': ' + error.message);
                            return;
                        }

                        console.log('Found ', data.length, ' friends for user ', displayName);
                        const friends: Friends[] = [];
                        data.forEach(friend => {
                            friends.push(<Friends>{
                                peer1: friend.peer1,
                                peer2: friend.peer2,
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

                this.connection
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

    private getFormattedDate(millis: string): string {
        const date: Date = new Date(millis);
        return date.toDateString();
    }

    private dbConfig: any = {};
    private connection: Connection;
}