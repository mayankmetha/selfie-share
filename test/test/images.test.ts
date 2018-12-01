import { assert } from 'chai';
import { ImageDetails, UserCreateRequest } from './model';
import { HttpClient } from './http.service';
import * as fs from 'fs';

describe('ImagesApiTest', () => {
    const config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'UTF-8'));
    const httpClient: HttpClient = new HttpClient(config.serverUrl);

    const user1 = 'user1';
    const user2 = 'user2';

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
            resolve();
        });
    });

    after('TearDown', async () => {
        // Delete the users
        await httpClient.delete('users', user1).toPromise();
        await httpClient.delete('users', user2).toPromise();
    });

    describe('POST /images test', () => {
        it('Should upload an image', async () => {
            console.log('\tUploading demo image for user1');
            try {
                await httpClient.sendFile(
                    'users/' + user1 + '/images', __dirname + '/selfie.share.jpg').toPromise();
                console.log('Successfully uploaded the image');
            } catch (err) {
                return new Promise(async (resolve) => {
                    assert.fail('Failed to upload image: ', err);
                    resolve();
                });
            }
        });

        it('Should upload a duplicate image', async () => {
            console.log('\tUploading demo image once again for user1');
            try {
                await httpClient.sendFile(
                    'users/' + user1 + '/images', __dirname + '/selfie.share.jpg').toPromise();
                console.log('Successfully uploaded the image');
            } catch (err) {
                return new Promise(async (resolve) => {
                    assert.fail('Failed to upload image: ', err);
                    resolve();
                });
            }
        });
    });

    describe('GET /images test', () => {
        it('Should get list of image', () => {
            return new Promise(async (resolve) => {
                console.log('\tListing images for user1');
                const data = await httpClient.get('users/user1/images').toPromise();
                    assert.isDefined(data);
                    assert.equal(JSON.parse(data).length, 2);
                    console.log('\n\n--------------------\n\n');
                    console.log(data);
                    console.log('\n\n--------------------\n\n');
                resolve();
            });
        });

        it('Should get an empty list', () => {
            return new Promise(async (resolve) => {
                console.log('\tListing images for user2');
                httpClient.get('users/user2/images').toPromise().then((data: any) => {
                    assert.isDefined(data);
                    assert.equal(JSON.parse(data).length, 0, 'Error: ' + data.length + ' images returned instead of 0');
                    resolve();
                });
            });
        });
    });

    describe('DELETE /images test', () => {
        var imageId: string;

        it('Should delete an image', async () => {
            return new Promise(async (resolve) => {
                console.log('\tDeleting an images for user1');
                const images: string = await httpClient.get('users/' + user1 + '/images').toPromise();
                assert.isAtLeast(JSON.parse(images).length, 1, 'No images were found for user');
                imageId = JSON.parse(images)[0].imageId;
                await httpClient.delete('users/user1/images', imageId).toPromise();
                resolve();
            });
        });

        it('Should fail to delete the image', () => {
            return new Promise(async (resolve) => {
                await httpClient.delete('users/user1/images', imageId).toPromise();
                resolve();
            });
        });
    });
});