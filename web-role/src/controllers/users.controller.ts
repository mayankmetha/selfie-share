
// Import only what we need from express
import { User, CustomError, UserCreateRequest, Friends, ImageDetails, frModel, ImageNotification } from '../model';
import { Route, Get, Post, Body, Query, SuccessResponse, Response, Controller, Delete } from 'tsoa';
import { UserManager, ImageManager } from '../service';
import { Observable } from 'rxjs';

@Route('users')
export class UserController extends Controller {

    @Response('500', 'Internal Server Error, when fails to connect to the DB')
    @SuccessResponse('200', 'List of all available users')
    @Get()
    public async getAllUsers(@Query() displayName?: string): Promise<User[]> {
        try {
            const users = await this.userManager.getAllUsers(displayName).toPromise();
            return users;
        } catch (error) {
            console.error('Failed to get users: ' + error);
            this.setStatus(500);
            throw new CustomError(500, error);
        }
    }

    @SuccessResponse('200', 'User with the specified id')
    @Response('404', 'Failed to find the user with the specified Id')
    @Response('500', 'Failed to connect to the DB server')
    @Get('{id}')
    public async getUser(id: string): Promise<User> {
        try {
            const users = await this.userManager.getUser(id).toPromise();
            return users;
        } catch (error) {
            console.error('Failed to get users: ' + error);
            let status = 500;
            if (String(error).toLowerCase().indexOf('not found') >= 0) {
                status = 404;
            }
            this.setStatus(status);
            throw new CustomError(status, error);
        }
    }

    @Response('500', 'If the username requested already exists')
    @Response('400', 'If any required fields are missing in the request')
    @SuccessResponse('201', 'Created')
    @Post()
    public async createUser(@Body() requestBody: UserCreateRequest): Promise<void> {
        try {
            var data = await this.userManager.createUser(requestBody).toPromise();
            this.setStatus(201);
        } catch (error) {
            console.error('Failed to create user: ', error);
            this.setStatus(500);
            throw new CustomError(500, error);
        }
    }

    @Response('500', 'DB connection failed')
    @Response('400', 'The id was not specified')
    @SuccessResponse('200', 'The user doesn\'t exist, or was successfully deleted')
    @Delete('{id}')
    public async deleteUser(id: string): Promise<void> {
        if (!id || id === '') {
            throw new CustomError(400, 'The user name cannot be empty');
        }

        try {
            // Get all friends, and unfriend each one
            const friends = await this.getFriendsForUser(id);
            console.log('User ', id, ' has ', friends.length, ' friends');
            const obs: Promise<void>[] = [];
            friends.forEach((friend: Friends) => {
                obs.push(this.unfriendUsers(friend.peer1, friend.peer2));
            });
            await Promise.all(obs);
            await this.userManager.deleteUser(id).toPromise();
        } catch (error) {
            console.error('Failed to delete user: ', error);
            this.setStatus(500);
            throw new CustomError(500, error);
        }
    }

    /**
     * Get other users who are friends with the current user
     * @param id the display name of the user
     */
    @Response('500', 'Internal server error')
    @Response('404', 'The specified user was not found')
    @SuccessResponse('200', 'List of friends for the user')
    @Get('{id}/friends')
    public async getFriendsForUser(id: string): Promise<Friends[]> {
        try {
            await this.getUser(id); // Checks to see if user exists
            return await this.userManager.getFriendsForUser(id).toPromise();
        } catch (error) {
            console.error('Failed to get friends for user: ', error);
            if (error instanceof CustomError) {
                this.setStatus(error.statusCode);
                throw error;
            }

            this.setStatus(500);
            throw new CustomError(500, error);
        }
    }

    /**
     * Unfriend the two users. Any images shared b/w the users are removed first.
     * @param user1 the user invoking the request
     * @param user2 the user to unfriend
     */
    @Response('500', 'Internal server error')
    @Response('404', 'The specified user was not found')
    @SuccessResponse('200', 'Unfriend the two users')
    @Delete('{user1}/friends/{user2}')
    public async unfriendUsers(user1: string, user2: string): Promise<void> {
        try {
            await this.getUser(user1); // Checks to see if user exists
            await this.getUser(user2); // Checks to see if user exists

            // Unshare any images
            const sharedWithImages: ImageDetails[] = [];
            const sharedByImages: ImageDetails[] = [];
            sharedWithImages.concat(await this.imageManager.getImagesSharedWithUser(user1, user2).toPromise());
            sharedByImages.concat(await this.imageManager.getImagesSharedByUser(user1, user2).toPromise());

            // Unshare all the images
            const promises: Promise<void>[] = [];
            sharedWithImages.forEach(image => {
                promises.push(this.imageManager.unshareImageWithUser(user1, user2, image.imageId ? image.imageId : '').toPromise());
            });

            sharedByImages.forEach(image => {
                promises.push(this.imageManager.unshareImageWithUser(user2, user1, image.imageId ? image.imageId : '').toPromise());
            });

            await Promise.all(promises);

            await this.userManager.unfriendUsers(user1, user2).toPromise();
        } catch (error) {
            console.error('Failed to get friends for user: ', error);
            if (error instanceof CustomError) {
                this.setStatus(error.statusCode);
                throw error;
            }

            this.setStatus(500);
            throw new CustomError(500, error);
        }
    }

    /**
     * Get notifications for a particular user
     * @param user  user Id
     */
    @Response('500', 'Internal server error')
    @Response('404', 'The specified user was not found')
    @SuccessResponse('200', 'Notifications for the user, if any')
    @Get('{user}/notifications')
    public async getNotifications(user: string): Promise<ImageNotification[]> {
        try {
            const notifications: ImageNotification[] = await this.userManager.getNotifications(user).toPromise();
            return notifications;
        } catch (error) {
            let status = 500;
            console.error("Failed to get notifications for the user: ", error);

            const tmpError = String(error).toLowerCase();

            if (tmpError.indexOf("invalid") >= 0) {
                status = 400;
            } else if (tmpError.indexOf("not found") >= 0) {
                status = 404;
            }

            this.setStatus(status);
            throw new CustomError(status, error);
        }
    }

    private userManager: UserManager = new UserManager();
    private imageManager: ImageManager = new ImageManager();
}