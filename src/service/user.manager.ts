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
            this.connection.query('INSERT INTO users values (?,?,?,?,?,?,?)',
                [user.displayName, user.email, user.profilePicUrl, user.profession, user.description, user.age, 0],
                (error) => {
                    if (error) {
                        console.error("Query failed: ", error);
                        observer.error(error);
                    } else {
                        console.log('Successfully created user: ', user.displayName);
                        observer.next(undefined);
                        observer.complete();
                    }
                });
        });
    }

    public getAllUsers(): Observable<User[]> {
        return new Observable<User[]>((observer: Observer<User[]>) => {
            try {
                this.connection.query('SELECT * FROM users', (error, data: mysql.RowDataPacket[]) => {
                    if (error) {
                        throw error;
                    }
                    const users: User[] = [];
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
                    observer.next(users);
                    observer.complete();
                });
            } catch (error) {
                observer.error(error);
            }
        });
    }

    private dbConfig: any = {};
    private connection: Connection;
}