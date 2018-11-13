import { expect, assert } from 'chai';
import { User, UserCreateRequest } from '../src/model';
import { HttpClient } from '../src/service/http.service';
import 'mocha';

describe('UsersApiTests', () => {
    const httpClient: HttpClient = new HttpClient('http://localhost:3000');
    const userName = Number(Math.floor(Math.random() * 100) + 1).toString();

    it('Should create a new user', () => {
        console.log('Creating user with name ', userName);
        const user: UserCreateRequest = { 'userName': userName, 'email': 'test@test.com' };
        var pr = httpClient.post('users', user);
        pr.subscribe((data: any) => {
            console.log("Successfully created user: ", data);
            expect(data).ok;
        }, error => {
            console.error("Failed to execute request: ", error);
            expect(false, "Error: " + error);
        });
        return pr.toPromise();
    });

    it('Should return list of users', () => {
        var pr = httpClient.get('users');
        pr.subscribe((data: User[]) => {
            console.log("Result: ", data);
            expect(data.length).greaterThan(0, "No users returned");
        }, error => {
            console.error("Failed: ", error);
            expect.fail('Error getting users');
        });
        return pr.toPromise();
    });
});