import { assert } from 'chai';;
import { HttpClient } from '../src/service/http.service';
import { User, Friends, UserCreateRequest } from '../src/model';
import * as fs from 'fs';

describe('Friends API tests', () => {

    const user1 = 'user1';
    const user2 = 'user2';
    const user3 = 'user3';
    const config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'UTF-8'));
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

    before(async () => {
        return new Promise(async resolve => {
            // Create 2 users,
            const userA = await createUser(user1);
            const userB = await createUser(user2);
            await createUser(user3);
            assert.isNotNull(userA, 'Failed to create user1');
            assert.isNotNull(userB, 'Failed to create user2');

            // Create friend request
            const frId = await httpClient.post('friendrequest', { fromUser: user1, toUser: user2 }).toPromise();

            // Accept friend request
            await httpClient.put('friendrequest', frId.frId, "").toPromise();

            resolve();
        });
    });

    after(async () => {
        return new Promise(async (resolve) => {
            // Delete the users
            await httpClient.delete('users', user1).toPromise();
            await httpClient.delete('users', user2).toPromise();
            await httpClient.delete('users', user3).toPromise();
            resolve();
        });
    });

    it('Should get friends of a user', async () => {
        try {
            const friendsUser1 = <Friends[]>JSON.parse(await httpClient.get('users/' + user1 + '/friends').toPromise());
            const friendsUser2 = <Friends[]>JSON.parse(await httpClient.get('users/' + user2 + '/friends').toPromise());

            assert.isNotNull(friendsUser1, 'Failed to fetch user1 friends');
            assert.isNotNull(friendsUser2, 'Failed to get user2 friends');

            assert.equal(friendsUser1.length, 1, 'Invalid number of friends returned for user1: ' + friendsUser1.length);
            assert.equal(friendsUser2.length, 1, 'Invalid number of friends returned for user1: ' + friendsUser1.length);
        } catch (error) {
            console.log('\n\n--------------------\n\n');
            console.error('Error is: ', error);
            console.log('\n\n--------------------\n\n');
            assert.fail('One or more APIs or assertions failed');
        }
    });

    it('Should unfriend two users', async () => {
        try {
            await httpClient.delete('users/' + user1 + '/friends', user2).toPromise();

            const friendsUser1 = <Friends[]>JSON.parse(await httpClient.get('users/' + user1 + '/friends').toPromise());
            const friendsUser2 = <Friends[]>JSON.parse(await httpClient.get('users/' + user2 + '/friends').toPromise());

            assert.isNotNull(friendsUser1, 'Failed to get friends for user1');
            assert.isNotNull(friendsUser2, 'Failed to get user2 friends');

            assert.isEmpty(friendsUser1, 'Failed to unfriend on user1');
            assert.isEmpty(friendsUser2, 'Failed to unfriend on user2');
        } catch (error) {
            console.log('\n\n--------------------\n\n');
            console.error('Error is: ', error);
            console.log('\n\n--------------------\n\n');
            assert.fail('One or more APIs or assertions failed');
        }
    });

    it('Should fail to unfriend users who are not friends', async () => {
        try {
            await httpClient.delete('users/' + user1 + '/friends', user2).toPromise();
            assert.fail('The attempt to unfriend users succeeded, where it should have failed');
        } catch (error) {
            console.log('\n\n--------------------\n\n');
            console.error('Failed to unfriend users as expected: ', error);
            console.log('\n\n--------------------\n\n');
        }
    });
});