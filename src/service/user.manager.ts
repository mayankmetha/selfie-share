import { User, UserCreateRequest } from '../model';
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
        if (!user || !user.email || user.email === '') {
            throw 'The email for the user cannot be empty';
        }

        if (!user.displayName || user.displayName === '') {
            throw 'The username cannot be empty';
        }

        return new Observable<void>((observer: Observer<void>) => {
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

                    const user = data[0];
                    observer.next(<User>{
                        displayName: user.displayName,
                        email: user.email,
                        profilePicUrl: user.profilePicUrl,
                        profession: user.profession,
                        description: user.description,
                        age: user.age,
                        numberOfFriends: 0
                    });
                    observer.complete();
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

    private dbConfig: any = {};
    private connection: Connection;
}