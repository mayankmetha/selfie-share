import * as request from 'request';
import { Observable, Observer } from 'rxjs';

export class HttpClient {
    public constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private fullUrl(relativeUrl: string): string {
        return this.baseUrl + '/' + relativeUrl;
    }

    public get(relativeUrl: string): Observable<any> {
        return new Observable<any>((observer: Observer<any>) => {
            request.get(this.fullUrl(relativeUrl), (error, response, body) => {
                if (error) {
                    observer.error(error);
                } else {
                    observer.next(body);
                    observer.complete();
                }
            });
        });
    }

    public getSimpleFiltered(relativeUrl: string, key: string, value: string): Observable<any> {
        const props: Map<string, string> = new Map<string, string>();
        props.set(key, value);
        return this.getFiltered(relativeUrl, props);
    }

    public getFiltered(relativeUrl: string, queryParams: Map<string, string>): Observable<any> {
        return new Observable<any>((observer: Observer<any>) => {
            let properties: any = {};
            queryParams.forEach((value: string, key: string) => {
                properties[key] = value;
            });

            request.get(this.fullUrl(relativeUrl), { qs: properties }, (error, response, body) => {
                if (error) {
                    observer.error(error);
                } else {
                    observer.next(body);
                    observer.complete();
                }
            });
        });
    }

    public post(relativeUrl: string, body: any): Observable<any> {
        return new Observable<any>((observer: Observer<any>) => {
            request.post(this.fullUrl(relativeUrl), { json: body }, (error, response, body) => {
                if (error) {
                    observer.error(error ? error : body);
                } else {
                    observer.next(body);
                    observer.complete();
                }
            });
        });
    }

    public delete(relativeUrl: string): Observable<any> {
        return new Observable<any>((observer: Observer<any>) => {
            request.delete(this.fullUrl(relativeUrl), (error, response, body) => {
                if (error) {
                    observer.error(error);
                } else {
                    observer.next(body);
                    observer.complete();
                }
            });
        });
    }

    public put(relativeUrl: string, body: any): Observable<any> {
        return new Observable<any>((observer: Observer<any>) => {
            request.post(this.fullUrl(relativeUrl), { json: body }, (error, response, body) => {
                if (error) {
                    observer.error(error);
                } else {
                    observer.next(body);
                    observer.complete();
                }
            });
        });
    }

    private baseUrl: string;
}