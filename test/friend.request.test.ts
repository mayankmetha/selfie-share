import { assert } from 'chai';;
import { HttpClient } from '../src/service/http.service';
import { readFileSync } from 'fs';
import { UserCreateRequest } from '../src/model';
import { fail } from 'assert';
import { async } from 'rxjs/internal/scheduler/async';
import { resolve } from 'dns';

describe('Friend Requests API tests', () => {

    const user1 = 'user1';
    const user2 = 'user2';
    const user3 = 'user3';
    const config = JSON.parse(readFileSync(__dirname + '/config.json', 'UTF-8'));
    const httpClient: HttpClient = new HttpClient(config.serverUrl);

    async function createUser(userName: string): Promise<string> {
        const user: UserCreateRequest = {
            displayName: userName, email: 'test@test.com',
            profession: '', profilePicUrl: '', age: 20, description: '', password: 'asfdasf'
        };

        return httpClient.post('users', user)
            .toPromise()
            .catch((err: any) => {
                assert.isNull(err, err);
            });
    }

    before('Create Setup', () => {
        return new Promise(async (resolve) => {
            await createUser(user1);
            await createUser(user2);
            await createUser(user3);
            resolve();
        });
    });

    after('TearDown', async () => {
        // Delete the users
        await httpClient.delete('users', user1).toPromise();
        await httpClient.delete('users', user2).toPromise();
        await httpClient.delete('users', user3).toPromise();
    });

    let frId: string = '';

    describe('Create Friend Request tests', () => {
        it('Should create a friend request', async () => {
            return new Promise(async (resolve) => {
                const response = await httpClient.post('friendrequest', { fromUser: user1, toUser: user2 }).toPromise();
                assert.isDefined(response, 'Failed to get valid response from server');
                assert.isDefined(response.frId, 'Invalid friend request ID returned: ' + response);
                frId = response.frId;
                resolve();
            });
        });

        it('Should fail to create a duplicate friend request', async () => {
            try {
                const response = await httpClient.post('friendrequest', { fromUser: user1, toUser: user2 }).toPromise();
                console.log('Received response: ', response);
                assert.fail('The request to create duplicate friend request succeeded!');
            } catch (error) {
                return new Promise(async (resolve) => {
                    console.log('Error creating duplicate FR: ', error, ' which is expected');
                    resolve();
                });
            }
        });

        it('Should fail to create inverse friend request', async () => {
            try {
                const response = await httpClient.post('friendrequest', { fromUser: user2, toUser: user1 }).toPromise();
                console.log('Received response: ', response);
                assert.fail('The request to create inverse friend request succeeded!');
            } catch (error) {
                return new Promise(async (resolve) => {
                    console.log('Error creating inverse FR: ', error, ' which is expected');
                    resolve();
                });
            }
        });
    });

    describe('Get Friend Requests API tests', () => {
        it('Should get all open friend requests', async () => {
            return new Promise(async (resolve) => {
                const response: string = await httpClient.get('users/' + user2 + '/friendrequest').toPromise();
                assert.isDefined(response, 'Invalid response from server');
                assert.equal(JSON.parse(response).length, 1, 'Failed to get friend requests');
                resolve();
            });
        });

        it('Should get 0 friend requests', async () => {
            return new Promise(async (resolve) => {
                const response: string = await httpClient.get('users/' + user1 + '/friendrequest').toPromise();
                assert.isDefined(response, 'Invalid response from server');
                assert.equal(JSON.parse(response).length, 0, 'Wrong number of friend requests returned');
                resolve();
            });
        });
    });

    describe('Accept friend request API tests', () => {
        it('Should succeed in accepting friend request', async () => {
            return new Promise(async (resolve) => {
                await httpClient.put('friendrequest', frId, { action: 'accept' }).toPromise();

                // Expect the friends API to return 1
                const friends: string = await httpClient.get('users/' + user1 + '/friends').toPromise();
                assert.isDefined(friends, 'Invalid response from server');
                assert.equal(JSON.parse(friends).length, 1, 'Invalid number of friends returned!');

                const friendsU2: string = await httpClient.get('users/' + user2 + '/friends').toPromise();
                assert.isDefined(friendsU2, 'Invalid response from server');
                assert.equal(JSON.parse(friendsU2).length, 1, 'Invalid number of friends returned!');

                // No friend requests open
                const frs: string = await httpClient.get('users/' + user2 + '/friendrequest').toPromise();
                assert.isDefined(frs);
                assert.equal(JSON.parse(frs).length, 0, 'Friend request still left open');
                resolve();
            });
        });

        it('Should fail to accept already accepted request', async () => {
            try {
                await httpClient.put('friendrequest', frId, { action: 'accept' }).toPromise();
                assert.fail('Accepted duplicate friend request');
            } catch (err) {
                return new Promise(async (resolve) => {
                    console.error('Failed to accept duplicate request: ', err, ' which is expected');
                    resolve();
                });
            }
        });
    });

});