import { frModel, Friends } from '../model/fr.model';
import * as shortid from 'shortid';
import * as mysql from 'mysql2';
import { Observable, Observer, forkJoin } from 'rxjs';
import { DbConnection } from './db.connection';
import { Time } from 'aws-sdk/clients/codepipeline';

export class frManager {
    public constructor() {
        this.dbConnection = new DbConnection();
        //this.awsInstance = new AWS();
    }
    public createFr(fr: frModel): Observable<string> {
        if (!fr.fromUser || fr.toUser === '') {
            throw ' cannot be empty';
        }
        if (!fr.toUser || fr.fromUser === '') {
            throw ' cannot be empty';
        }

        return new Observable<string>((observer: Observer<string>) => {
            const friendRequest: string = shortid.generate();
            try {
                let date: number = (new Date).getTime();
                this.dbConnection.getConnection().query('INSERT INTO friendRequest values (?,?,?,?)',
                    [friendRequest, fr.fromUser, fr.toUser, String(date)],
                    (error, data) => {

                        if (error) {
                            console.log("Query failed: ", error);
                            observer.error(error.message);
                            return;
                        }
                        console.log('friendRequest', friendRequest);
                        observer.next(friendRequest);
                        observer.complete();
                    });
            } catch (error) {
                observer.error(error);
            }
        });
    }

    public getAllFriendRequest(toUser: string): Observable<frModel[]> {
        return new Observable<frModel[]>((observer: Observer<frModel[]>) => {
            this.dbConnection.getConnection().query('SELECT * FROM friendRequest where toUser= ?', [toUser], (error, data: mysql.RowDataPacket[]) => {
                if (error) {
                    observer.error(error.message);
                    return;
                }

                let friendrequest: frModel[] = [];
                for (let i = 0; i < data.length; ++i) {
                    const frmodel = data[i];
                    friendrequest.push(<frModel>{
                        frId: frmodel.frId,
                        fromUser: frmodel.fromUser,
                        toUser: frmodel.toUser,
                        dateOfRequest: frmodel.dateOfRequest

                    });
                }


                // Find friends for each of the users..how?

                observer.next(friendrequest);
                observer.complete();
            });
        });

    }
    public acceptFriendRequest(frId: string): Observable<string> {
        return new Observable<string>((observer: Observer<string>) => {
            this.dbConnection.getConnection()
                .query('select *  FROM friendRequest where frId=(?)', [frId], (error, data: mysql.RowDataPacket[]) => {
                    if (error) {
                        observer.error(error.message);
                        return;
                    }
                    let friendrequest: frModel;

                    const frmodel = data[0];
                    friendrequest = <frModel>{
                        frId: frmodel.frId,
                        fromUser: frmodel.fromUser,
                        toUser: frmodel.toUser,
                        dateOfRequest: frmodel.dateOfRequest
                    };



                    this.dbConnection.getConnection()
                        .query('DELETE  FROM friendRequest where frId=(?)',
                            [frId], (error, data: mysql.RowDataPacket[]) => {
                                let date: number = (new Date).getTime();
                                this.dbConnection.getConnection()
                                    .query('INSERT INTO  friends values(?,?,?,?) ',
                                        [friendrequest.fromUser, friendrequest.toUser, String(date),
                                        friendrequest.frId], (error, data: mysql.RowDataPacket[]) => {
                                            if (error) {
                                                observer.error(error.message);
                                                return;
                                            }


                                            observer.next(friendrequest.frId);
                                            observer.complete();
                                        });
                            });
                });
        });

    }
    private dbConnection: DbConnection;

}