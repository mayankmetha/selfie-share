import { assert } from 'chai';
import { ImageDetails, UserCreateRequest } from '../src/model';
import { HttpClient } from '../src/service/http.service';
import * as fs from 'fs';

describe('ImagesApiTest', () => {
    const config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'UTF-8'));
    const httpClient: HttpClient = new HttpClient(config.serverUrl);

    const user1 = 'user1';
    async function createUser(userName: string): Promise<string> {
        const user: UserCreateRequest = {
            displayName: userName, email: 'test@test.com',
            profession: '', profilePicUrl: '', age: 20, description: '', password: 'asfdasf'
        };

        return httpClient.post('users', user)
            .toPromise()
            .catch((err) => {
                assert.isNull(err, err);
            });
    }

    before('Create Setup', () => {
        return new Promise(async (resolve) => {
            await createUser(user1);

            await httpClient.sendFile(user1,
                'users/' + user1 + '/images', __dirname + '/selfie.share.jpg',
                <ImageDetails>{
                    imageLoc: __dirname + '/selfie.share.jpg',
                    imageTime: (new Date()).getTime(),
                    userId: user1
                });

            resolve();
        });
    });

    after('TearDown', async () => {
        // Delete the users
        await httpClient.delete('users', user1).toPromise();
    });

    describe('POST /images test', () => {
        it('Should upload an image', () => {
            console.log('\tUploading demo image for user1');
            const image: ImageDetails = {
                userId: 'user1',
                imageId: 'image1',
                imageLoc: 'selfie.share.jpg',
                tag: '',
                imageTime: 1
            }
            return httpClient.post('users/user1/images', image).toPromise().catch((err) => {
                assert.isNull(err, err);
            });
        });

        it('Should upload an image', () => {
            console.log('\tUploading demo image once again for user1');
            const image: ImageDetails = {
                userId: 'user1',
                imageId: '',
                imageLoc: 'selfie.share.jpg',
                tag: '',
                imageTime: 1
            }
            return httpClient.post('users/user1/images', image).toPromise().catch((err) => {
                assert.isNull(err, err);
            });
        });
    });

    describe('GET /images test', () => {
        it('Should get list of image', () => {
            console.log('\tListing images for user1');
            return httpClient.get('users/user1/images').toPromise().then((data) => {
                assert.isDefined(data);
                assert.isAbove(JSON.parse(data).length, 0);
                console.log('\n\n--------------------\n\n');
                console.log(data);
                console.log('\n\n--------------------\n\n');
            });
        });
        it('Should get an empty list', () => {
            console.log('\tListing images for user2');
            return httpClient.get('users/user2/images').toPromise().then((data) => {
                assert.isDefined(data);
                assert.equal(JSON.parse(data).length, 0, 'Error: ' + data.length + ' images returned instead of 0');
            });
        });
    });

    describe('DELETE /images test', () => {
        var imageId: string;
        it('Should delete an image', async () => {
            console.log('\tDeleting an images for user1');
            const images: string = await httpClient.get('users/' + user1 + '/images').toPromise();
            assert.isAtLeast(JSON.parse(images).length, 1, 'No images were found for user');
            imageId = JSON.parse(images)[0].imageId;
            return httpClient.delete('users/user1/images', imageId).toPromise();
        });
        
        it('Should succeed to delete the image', () => {
            return httpClient.delete('users/user1/images', imageId).toPromise();
        });
    });
});