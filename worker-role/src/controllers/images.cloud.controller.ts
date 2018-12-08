import { Route, Post, SuccessResponse, Request, Response, Controller, Delete, Put } from 'tsoa';
import * as express from 'express';
import multer from 'multer';
import { CustomError, ImageUploadResponse } from '../model';
import { AWS, NotificationsManager } from '../service';
import { ImageManager } from '../service/images.manager';
import { unlink } from 'fs';

@Route('users')
export class ImageUploadController extends Controller {
    @Response('500', 'If the image Location requested already exists')
    @Response('400', 'If any required fields are missing in the request')
    @SuccessResponse('201', 'Created')
    @Post('{userId}/images/{imageId}')
    public async uploadImage(@Request() request: express.Request, userId: string, imageId: string): Promise<ImageUploadResponse> {
        return new Promise<ImageUploadResponse>(async (resolve, reject) => {
            try {
                const singleFile = multer({ storage: this.multerDiskStorage }).single('imageFile');
                //@ts-ignore
                singleFile(request, undefined, async (err: string) => {
                    if (err) {
                        console.log(err);
                        throw new CustomError(500, 'Failed to upload file: ' + err);
                    }

                    console.log('Filename: ', request.file.filename);
                    const imageLoc = __dirname + '/../tmpImages/' + request.file.filename;
                    console.log('Called!', imageLoc);

                    var data = await this.awsService.S3UploadFile(imageLoc, userId, imageId);
                    console.log('Image successfully uploaded to URL: ', data);

                    // Update DB with details
                    await this.imageManager.updateImageUrl(imageId, data);

                    // Send notifications
                    await this.notifMgr.sendNotifications(userId,
                        'A new image has been added by user ' + userId + ', navigate to ' + data + ' to view it.');

                    // Unlink local file
                    unlink(imageLoc, (err) => {
                        if (err) {
                            console.warn('Local file deletion failed: ', err);
                        }
                    });

                    this.setStatus(201);
                    resolve(<ImageUploadResponse>{
                        imageUrl: data
                    });

                });
            } catch (error) {
                console.error('Failed to upload image: ', error);
                this.setStatus(500);
                //throw new CustomError(500, error);
                reject(error);
            }
        });
    }

    private awsService: AWS = new AWS();
    private imageManager: ImageManager = new ImageManager();
    private notifMgr: NotificationsManager = new NotificationsManager();
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