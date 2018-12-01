
// Import only what we need from express
import { ImageDetails, CustomError } from '../model';
import { Route, Get, Post, Body, Query, SuccessResponse, Request, Response, Controller, Delete } from 'tsoa';
import { ImageManager } from '../service';
import * as express from 'express';
import multer from 'multer';

@Route()
export class ImageController extends Controller {

    /**
     * Get all images that belong to an user, or are shared with the user
     * @param userId The user id
     * @param sharedBy If specified, get all images that have been shared by this user, with the current user
     * @param sharedWith If specified, get all images that the current user has shared with the specified user
     */
    @Response('404', 'The specified user was not found')
    @Response('500', 'Internal Server Error, when fails to connect to the DB')
    @SuccessResponse('200', 'List of all available users image')
    @Get('users/{userId}/images')
    public async getAllImages(userId: string,
        @Query() sharedBy?: string,
        @Query() sharedWith?: string): Promise<ImageDetails[]> {
        try {
            console.log('Getting all images for user: ', userId, 'sharedWith=', sharedWith, 'sharedBy=', sharedBy);
            if (!sharedBy && !sharedWith) {
                return await this.imageManager.getAllImages(userId).toPromise();
            } else if (!sharedWith) {
                return await this.imageManager.getImagesSharedByUser(userId, sharedBy ? sharedBy : '')
                    .toPromise();
            } else if (!sharedBy) {
                return await this.imageManager.getImagesSharedWithUser(userId, sharedWith ? sharedWith : '')
                    .toPromise();
            } else {
                throw 'Invalid: Both sharedBy and sharedWith cannot be specified';
            }
        } catch (error) {
            let status = 500;
            console.error('Failed to get images for the user: ', error);

            const tmpError = String(error).toLowerCase();

            if (tmpError.indexOf('invalid') >= 0) {
                status = 400;
            } else if (tmpError.indexOf('not found') >= 0) {
                status = 404;
            }

            this.setStatus(status);
            throw new CustomError(status, error);
        }
    }

    @Response('500', 'If the image Location requested already exists')
    @Response('400', 'If any required fields are missing in the request')
    @SuccessResponse('201', 'Created')
    @Post('users/{userId}/images')
    public async uploadImage(@Request() request: express.Request, userId: string): Promise<void> {
        return new Promise<void>((resolve) => {
            try {
                const singleFile = multer({ storage: this.multerDiskStorage }).single('imageFile');
                //@ts-ignore
                singleFile(request, undefined, async (err: string) => {
                    if (err) {
                        console.log(err);
                        throw new CustomError(500, 'Failed to upload file: ' + err);
                    }

                    const imageDetails = <ImageDetails>{
                        userId: userId,
                        imageLoc: __dirname + '/../../tmpImages/' + request.file.filename,
                        imageTime: new Date().getTime()
                    };

                    var data = await this.imageManager.createImage(imageDetails).toPromise();
                    this.setStatus(201);
                    resolve();
                });
            } catch (error) {
                console.error('Failed to upload image: ', error);
                this.setStatus(500);
                throw new CustomError(500, error);
            }
        });
    }

    @Response('500', 'Internal Server Error, when fails to connect to the DB')
    @SuccessResponse('200', 'List of all available users image')
    @Delete('users/{userId}/images/{imageId}')
    public async deleteImage(userId: string, imageId: string): Promise<void> {
        try {
            // First check if the image has been shared with any users
            const users: string[] = await this.imageManager.getUsersWithWhomImageHasBeenShared(userId, imageId).toPromise();
            if (users.length > 0) {
                // Unshare with each user
                const promises: Promise<void>[] = [];
                users.forEach(user => {
                    promises.push(this.imageManager.unshareImageWithUser(userId, user, imageId).toPromise());
                });
                console.log('Unsharing image with ', users.length, ' users');

                await Promise.all(promises);
            }
            await this.imageManager.deleteImage(userId, imageId).toPromise();
        } catch (error) {
            let status = 500;
            console.error('Failed to share image: ', error);

            const tmpError = String(error).toLowerCase();

            if (tmpError.indexOf('invalid') >= 0) {
                status = 400;
            } else if (tmpError.indexOf('not found') >= 0) {
                status = 404;
            }

            this.setStatus(status);
            throw new CustomError(status, error);
        }
    }

    /**
     * Share an image with the given user
     * @param userId the owner of the image
     * @param targetUser the user to share the image with
     * @param requestBody the image to share
     */
    @Response('400', 'The input parameters were invalid')
    @Response('404', 'Either of the users, or the image was not found')
    @Response('500', 'Internal server error has occurred')
    @SuccessResponse('201', 'Successfully shared the image with the given user')
    @Post('users/{userId}/friends/{targetUser}/images')
    public async shareImageWithUser(userId: string, targetUser: string, @Body() requestBody: string[]): Promise<void> {
        try {
            console.log('Sharing image ', requestBody, ' with User ', targetUser, ' from user ', userId);
            await this.imageManager.shareImagesWithUser(userId, targetUser, requestBody).toPromise();
            this.setStatus(201);
        } catch (error) {
            let status = 500;
            console.error('Failed to share image: ', error);

            const tmpError = String(error).toLowerCase();

            if (tmpError.indexOf('invalid') >= 0) {
                status = 400;
            } else if (tmpError.indexOf('not found') >= 0) {
                status = 404;
            }

            this.setStatus(status);
            throw new CustomError(status, error);
        }
    }

    /**
     * Unshare the specified image with the user
     * @param userId the owner of the image
     * @param targetUser the user with whom the image needs to be unshared
     * @param imageId the image to unshare
     */
    @Response('500', 'Internal server error has occurred')
    @Response('404', 'Any of the users, or the image was not found')
    @Response('400', 'Any of the input parameters are invalid')
    @SuccessResponse('200', 'The image has been unshared')
    @Delete('users/{userId}/friends/{targetUser}/images/{imageId}')
    public async unshareImageWithUser(userId: string, targetUser: string, imageId: string): Promise<void> {
        try {
            console.log('Unsharing image', imageId, 'Owner is', userId, 'from user', targetUser);
            await this.imageManager.unshareImageWithUser(userId, targetUser, imageId).toPromise();
            console.log('Unsharing image successful');
        } catch (error) {
            let status = 500;
            console.error('Failed to unshare image: ', error);

            const tmpError = String(error).toLowerCase();

            if (tmpError.indexOf('invalid') >= 0) {
                status = 400;
            } else if (tmpError.indexOf('not found') >= 0) {
                status = 404;
            }

            this.setStatus(status);
            throw new CustomError(status, error);
        }
    }

    private imageManager: ImageManager = new ImageManager();
    private multerDiskStorage: multer.StorageEngine = multer.diskStorage({
        destination: function (req, file, callback) { callback(null, __dirname + '/../tmpImages'); },
        filename: function (req: express.Request, file, callback) {
            if (file) {
                callback(null, req.url.split('/')[2] + '_' + new Date().getTime() + '_' + file.originalname);
            } else {
                callback(new CustomError(500, 'Failed to upload file'), "null");
            }
        }
    });
}