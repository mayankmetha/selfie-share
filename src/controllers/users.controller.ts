
// Import only what we need from express
import { User, CustomError, UserCreateRequest, Friends } from '../model';
import { Route, Get, Post, Body, Query, SuccessResponse, Response, Controller, Delete } from 'tsoa';
import { UserManager } from '../service';

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
            await this.userManager.deleteUser(id).toPromise();
        } catch (error) {
            console.error('Failed to delete user: ', error);
            this.setStatus(500);
            throw new CustomError(500, error);
        }
    }

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

    @Response('500', 'Internal server error')
    @Response('404', 'The specified user was not found')
    @SuccessResponse('200', 'List of friends for the user')
    @Delete('{user1}/friends/{user2}')
    public async unfriendUsers(user1: string, user2: string): Promise<void> {
        try {
            await this.getUser(user1); // Checks to see if user exists
            await this.getUser(user2); // Checks to see if user exists

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

    private userManager: UserManager = new UserManager();
}