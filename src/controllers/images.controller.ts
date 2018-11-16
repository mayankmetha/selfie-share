
// Import only what we need from express
import { ImageDetails, } from '../model';
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

    private imageManager: ImageManager = new ImageManager();
}