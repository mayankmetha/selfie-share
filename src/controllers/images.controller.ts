
// Import only what we need from express
import { ImageDetails, CustomError } from '../model';
import { Route, Get, Post, Body, Query, SuccessResponse, Response, Controller, Delete } from 'tsoa';
import { ImageManager } from '../service';

@Route()
export class ImageController extends Controller {

    @Response('500', 'Internal Server Error, when fails to connect to the DB')
    @SuccessResponse('200', 'List of all available users image')
    @Get('users/{userId}/images')
    public async getAllImages(userId: string): Promise<ImageDetails[]> {
        const images = await this.imageManager.getAllImages(userId).toPromise();
        return images;
    }

    @Response('500', 'If the image Location requested already exists')
    @Response('400', 'If any required fields are missing in the request')
    @SuccessResponse('201', 'Created')
    @Post('users/{userId}/images')
    public async uploadImage(@Body() requestBody: ImageDetails): Promise<void> {
        try {
            var data = await this.imageManager.createImage(requestBody).toPromise();
            this.setStatus(201);
        } catch (error) {
            console.error('Failed to upload image: ', error);
            this.setStatus(500);
            throw new CustomError(500, error);
        }
    }

    @Response('500', 'Internal Server Error, when fails to connect to the DB')
    @SuccessResponse('200', 'List of all available users image')
    @Delete('users/{userId}/images/{imageId}')
    public async deleteImage(userId: string, imageId: string): Promise<void> {
        await this.imageManager.deleteImage(userId,imageId).toPromise();
    }

    private imageManager: ImageManager = new ImageManager();
}