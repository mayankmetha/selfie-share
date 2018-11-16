
// Import only what we need from express
import { User, CustomError, UserCreateRequest } from '../model';
import { Route, Get, Post, Body, Query, SuccessResponse, Response, Controller, Delete } from 'tsoa';
import { UserManager } from '../service';

@Route('users')
export class UserController extends Controller {

    @Response('500', 'Internal Server Error, when fails to connect to the DB')
    @SuccessResponse('200', 'List of all available users')
    @Get()
    public async getAllUsers(@Query() displayName?: string): Promise<User[]> {
        try {
            const users = this.userManager.getAllUsers().toPromise();
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
    public getUser(id: string): User {
        const user: User = {
            displayName: 'PR',
            email: 'a@b.com',
            numberOfFriends: 10,
            profession: 'Student',
            profilePicUrl: '',
            description: '',
            age: 20
        };
        return user;
    }

    @Response('500', "If the username requested already exists")
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

    private userManager: UserManager = new UserManager();
}