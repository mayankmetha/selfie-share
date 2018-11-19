import { assert } from 'chai';;
import { HttpClient } from '../src/service/http.service';
import * as fs from 'fs';
import { UserCreateRequest, ImageDetails } from '../src/model';

describe('Shared Images API Tests', () => {

    const config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'UTF-8'));
    const httpClient: HttpClient = new HttpClient(config.serverUrl);

    const user1 = 'user1';
    const user2 = 'user2';
    const user3 = 'user3';

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
            const userA = await createUser(user1);
            const userB = await createUser(user2);
            await createUser(user3);

            // Send friend request

            assert.isNotNull(userA, 'Failed to create user1');
            assert.isNotNull(userB, 'Failed to create user2');

            // Create friend request
            const frId = await httpClient.post('friendrequest', { fromUser: user1, toUser: user2 }).toPromise();

            // Accept friend request
            await httpClient.put('friendrequest', JSON.parse(frId).frId, { action: 'accept' }).toPromise();

            // Upload an image
            await httpClient.sendFile(
                'users/' + user1 + '/images', __dirname + '/selfie.share.jpg').toPromise();

            await httpClient.sendFile(
                'users/' + user1 + '/images', __dirname + '/selfie.share.jpg').toPromise();

            console.log('2 images uploaded successfully');
            resolve();
        });
    });

    after('TearDown', async () => {
        try {
            // Unfriend users
            await httpClient.delete('users/' + user1 + '/friends/', user2);
        } catch (error) { }

        // Delete the users
        await httpClient.delete('users', user1).toPromise();
        await httpClient.delete('users', user2).toPromise();
        await httpClient.delete('users', user3).toPromise();
    });

    describe('Share images with user', () => {
        it('Should share an image with one user', async () => {
            try {
                const images: string = await httpClient.get('users/' + user1 + '/images').toPromise();
                assert.isAtLeast(JSON.parse(images).length, 1, 'No images were found for user');

                const imageId = JSON.parse(images)[0].imageId;

                await httpClient.post('users/' + user1 + '/friends/' + user2 + '/images', [imageId]);
            } catch (error) {
                console.log('\n\n--------------------\n\n');
                console.error('Error is: ', error);
                console.log('\n\n--------------------\n\n');
                assert.fail('One or more APIs or assertions failed');
            }
        });

        it('Should fail to share already shared image', async () => {
            try {
                const images: string = await httpClient.get('users/' + user1 + '/images').toPromise();
                assert.isAtLeast(JSON.parse(images).length, 1, 'No images were found for user');

                const imageId = JSON.parse(images)[0].imageId;

                await httpClient.post('users/' + user1 + '/friends/' + user2 + '/images', [imageId]);
                assert.fail('Test failed - success returned where request should have failed');
            } catch (error) {
                if (error.AssertionError) {
                    throw error;
                }
                console.error('Error is: ', error, ' which is expected');
            }
        });

        it('Should fail to share image that doesnt exist', async () => {
            try {
                await httpClient.post('users/' + user1 + '/friends/' + user2 + '/images', ['junkvalues']);
                assert.fail('Test failed - success returned where request should have failed');
            } catch (error) {
                console.error('Error is: ', error, ' which is expected');
            }
        });
    });

    describe('Get Shared images with user', () => {
        it('Should get all images shared with one user', async () => {
            try {
                const images = await httpClient.getSimpleFiltered('users/' + user1 + '/images', 'sharedWith', user2).toPromise();
                assert.isDefined(images);
                assert.equal(JSON.parse(images).length, 1, 'Wrong number of images found');
            } catch (error) {
                console.log('\n\n--------------------\n\n');
                console.error('Error is: ', error);
                console.log('\n\n--------------------\n\n');
                assert.fail('One or more APIs or assertions failed');
            }
        });

        it('Should get all images shared by one user', async () => {
            try {
                const images = await httpClient.getSimpleFiltered('users/' + user2 + '/images', 'sharedBy', user2).toPromise();
                assert.isDefined(images);
                assert.equal(JSON.parse(images).length, 1, 'Wrong number of images found');
            } catch (error) {
                console.log('\n\n--------------------\n\n');
                console.error('Error is: ', error);
                console.log('\n\n--------------------\n\n');
                assert.fail('One or more APIs or assertions failed');
            }
        });

        it('Should return zero images shared with user', async () => {
            try {
                const images = await httpClient.getSimpleFiltered('users/' + user1 + '/images', 'sharedWith', user3).toPromise();
                assert.isDefined(images);
                assert.equal(JSON.parse(images).length, 0, 'Wrong number of images found');
            } catch (error) {
                console.log('\n\n--------------------\n\n');
                console.error('Error is: ', error);
                console.log('\n\n--------------------\n\n');
                assert.fail('One or more APIs or assertions failed');
            }
        });

        it('Should return zero images shared by user', async () => {
            try {
                const images = await httpClient.getSimpleFiltered('users/' + user1 + '/images', 'sharedBy', user3).toPromise();
                assert.isDefined(images);
                assert.equal(JSON.parse(images).length, 0, 'Wrong number of images found');
            } catch (error) {
                console.log('\n\n--------------------\n\n');
                console.error('Error is: ', error);
                console.log('\n\n--------------------\n\n');
                assert.fail('One or more APIs or assertions failed');
            }
        });
    });

    describe('Tests for unshared images', () => {
        let imageId: string = '';

        it('Should unshare an image', async () => {
            try {
                const images: string = await httpClient.getSimpleFiltered('users/' + user1 + '/images', 'sharedWith', user2).toPromise();
                assert.isDefined(images);
                assert.equal(JSON.parse(images).length, 1, 'Wrong number of images found');
                imageId = JSON.parse(images[0]).imageId;
                await httpClient.delete('users/' + user1 + '/friends/' + user2 + '/images', imageId);
            } catch (error) {
                console.log('\n\n--------------------\n\n');
                console.error('Error is: ', error);
                console.log('\n\n--------------------\n\n');
                assert.fail('One or more APIs or assertions failed');
            }
        });

        it('Should fail to unshare an image that is already unshared', async () => {
            try {
                await httpClient.delete('users/' + user1 + '/friends/' + user2 + '/images', imageId).toPromise();
                console.log('\n\n--------------------\n\n');
                assert.fail('Successfully unshared image that is already unshared, which is wrong');
                console.log('\n\n--------------------\n\n');
            } catch (error) {
                console.error('Error is: ', error, ' which is expected');
                throw error;
            }
        });

        it('Should fail to unshare an image that doesnt exist', async () => {
            try {
                await httpClient.delete('users/' + user1 + '/friends/' + user2 + '/images', 'junk');
                console.log('\n\n--------------------\n\n');
                assert.fail('Successfully unshared image that doesnt exist, which is wrong');
                console.log('\n\n--------------------\n\n');
            } catch (error) {
                console.error('Error is: ', error, ' which is expected');
            }
        });


        it('Should fail to unshare an image that doesnt belong to user', async () => {
            try {

                const images: string = await httpClient.get('users/' + user2 + '/images').toPromise();
                assert.isAtLeast(JSON.parse(images).length, 1, 'No images were found for user');

                let imageId = JSON.parse(images)[0].imageId;

                await httpClient.post('users/' + user2 + '/friends/' + user3 + '/images', [{
                    imageId: imageId
                }]);

                const shImgs: string = await httpClient.getSimpleFiltered('users/' + user2 + '/images', 'sharedWith', user3).toPromise();
                assert.isDefined(shImgs);
                assert.equal(JSON.parse(shImgs).length, 1, 'Wrong number of images found');

                imageId = JSON.parse(shImgs[0]).imageId;
                await httpClient.delete('users/' + user1 + '/friends/' + user3 + '/images', 'junk');
                console.log('\n\n--------------------\n\n');
                assert.fail('Successfully unshared image that doesnt belong to user, which is wrong');
                console.log('\n\n--------------------\n\n');
            } catch (error) {
                console.error('Error is: ', error, ' which is expected');
            }
        });
    });

});

