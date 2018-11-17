import { assert } from 'chai';
import { User, UserCreateRequest } from '../src/model';
import { HttpClient } from '../src/service/http.service';
import * as fs from 'fs';

describe('UsersApiTests', () => {
    const config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'UTF-8'));
    const httpClient: HttpClient = new HttpClient(config.serverUrl);
    const userName = Number(Math.floor(Math.random() * 100) + 1).toString();

    describe('POST /users tests', () => {
        it('Should create a new user', () => {
            console.log('Creating user with name ', userName);
            const user: UserCreateRequest = {
                displayName: userName, email: 'test@test.com',
                profession: '', profilePicUrl: '', age: 20, description: '', password: 'asfdasf'
            };

            return httpClient.post('users', user).toPromise().catch((err) => {
                assert.isNull(err, err);
            });
        });

        it('Should fail to create a user', () => {
            const user: UserCreateRequest = {
                displayName: userName, email: 'test@test.com',
                profession: '', profilePicUrl: '', age: 20, description: '', password: 'asfdasf'
            };

            return httpClient.post('users', user).toPromise().then(() => {
                assert.fail('Duplicate user gets created');
            }).catch(() => {
            });
        });
    });

    describe('GET /users Tests', () => {
        it('Should return list of users', () => {
            return httpClient.get('users').toPromise().then((data) => {
                assert.isDefined(data);
                assert.isAbove(JSON.parse(data).length, 0);
                console.log('\n\n--------------------\n\n');
                console.log(data);
                console.log('\n\n--------------------\n\n');
            });
        });

        it('Should display all users of given name', () => {
            return httpClient.getSimpleFiltered('users', 'displayName', userName)
                .toPromise()
                .then((data: string) => {
                    assert.isDefined(data);
                    assert.isAbove(JSON.parse(data).length, 0, 'Expected number of users to be greater than 0');
                    console.log('\n\n--------------------\n\n');
                    console.log(data);
                    console.log('\n\n--------------------\n\n');
                });
        });

        it('Should get an individual user', () => {
            return httpClient.get('users/' + userName)
                .toPromise()
                .then((data: User) => {
                    assert.isDefined(data);
                    console.log('\n\n--------------------\n\n');
                    console.log(data);
                    console.log('\n\n--------------------\n\n');
                });
        });

        it('Should return an empty list of users', () => {
            return httpClient.getSimpleFiltered('users', 'displayName', 'junkvaluestoomuch')
                .toPromise()
                .then((users: string) => {
                    assert.isDefined(users);
                    assert.equal(JSON.parse(users).length, 0, 'Error: ' + users.length + ' users returned instead of 0');
                });
        })
    });

    describe('DELETE /users tests', () => {
        it('Should delete the specified user', () => {
            return httpClient.delete('users', userName)
                .toPromise();
        });

        it('Should succeed to delete the user', () => {
            return httpClient.delete('users', userName)
                .toPromise();
        });
    });
});