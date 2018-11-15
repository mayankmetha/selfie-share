import { UserDetails, User } from '../model';
import * as shortid from 'shortid';
import * as mysql from 'mysql2';
import { Connection, RowDataPacket } from 'mysql2';
import { Observable, Observer } from 'rxjs';

export class UserManager {

    /**
     * Inserts a user into the DB. If the user exists, throws an error.
     * Returns a unique id for the user.
     * @param user 
     */
    public createUser(user: UserDetails): Observable<string> {
        if (!user || !user.email || user.email === '') {
            throw 'The email for the user cannot be empty';
        }

        if (!user.displayName || user.displayName === '') {
            throw 'The username cannot be empty';
        }

        return new Observable<string>((observer: Observer<string>) => {
            user.userId = shortid.generate();
            try {
                this.connection.query('INSERT INTO users values (?,?,?,?,?)',
                    [user.userId, user.displayName, user.email, user.profession, user.userId, user.profilePicUrl],
                    (error, data) => {

                        if (error) {
                            console.error("Query failed: ", error);
                            throw error;
                        }
                    });

                console.log('Successfully created user: ', user.userId);
                observer.next(user.userId);
                observer.complete();
            } catch (error) {
                observer.error(error);
            }
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
                            userId: user.userId,
                            displayName: user.displayName,
                            email: user.email,
                            profilePicUrl: user.profilePicUrl,
                            profession: user.profession,
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

    private connection: Connection = mysql.createConnection(<mysql.ConnectionOptions>{
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'selfie_share'
    });
}