import { expect } from 'chai';
import { User, UserCreateRequest } from '../src/model';
import { HttpClient } from '../src/service/http.service';
import 'mocha';

describe('UsersApiTests', () => {
    const httpClient: HttpClient = new HttpClient('http://localhost:3000');
    const userName = Number(Math.floor(Math.random() * 100) + 1).toString();
    let userId: string = '';

    describe('POST /users tests', () => {
        it('Should create a new user', () => {
            console.log('Creating user with name ', userName);
            const user: UserCreateRequest = {
                displayName: 'displayName', email: 'test@test.com',
                profession: '', profilePicUrl: '', age: 20, description: '', password: 'asfdasf'
            };

            var pr = httpClient.post('users', user);
            pr.subscribe((data: any) => {
                console.log("Successfully created user: ", data);
                expect(data).ok;
                userId = data;
            }, error => {
                console.error("Failed to execute request: ", error);
                expect.fail("Error: " + error);
            });
            return pr.toPromise();
        });

        it('Should fail to create a user', () => {
            const user: UserCreateRequest = {
                displayName: 'displayName', email: 'test@test.com',
                profession: '', profilePicUrl: '', age: 20, description: '', password: 'asfdasf'
            };

            var pr = httpClient.post('users', user);
            pr.subscribe((data: any) => {
                console.log("Successfully created user: ", data);
                expect.fail("Error: Duplicate user created!");
            }, error => {
                console.log('User creation failed as expected: ', error);
            });
            return pr.toPromise();
        });
    });

    describe('GET /users Tests', () => {
        it('Should return list of users', () => {
            var pr = httpClient.get('users');
            pr.subscribe((data: User[]) => {
                console.log("Number of users: ", data.length);
                expect(data.length).greaterThan(0, "No users returned");
            }, error => {
                console.error("Failed: ", error);
                expect.fail('Error getting users');
            });
            return pr.toPromise();
        });

        it('Should display all users of given name', () => {
            var pr = httpClient.getSimpleFiltered('users', 'displayName', 'test');
            pr.subscribe((data: User[]) => {
                console.log('Got ', data.length + ' users');
            }, error => {
                console.log('Error: ', error);
                expect.fail(error);
            });
            return pr;
        });
    });

    describe('DELETE /users tests', () => {
        it('Should delete the specified user', () => {
            var pr = httpClient.delete('users', userId);
            pr.subscribe((data: any) => {
                //console.log("Successfully deleted user: ", data);
            }, error => {
                console.log('User deletion failed: ', error);
                expect.fail('Failed to delete user: ' + error);
            });
            return pr.toPromise();
        });

        it('Should fail to delete the user', () => {
            var pr = httpClient.delete('users', userName);
            pr.subscribe((data: any) => {
                expect.fail("Error: Non existent user deleted!");
            }, error => {
                console.log('User deletion failed as expected: ', error);
            });
            return pr.toPromise();
        });
    });
});