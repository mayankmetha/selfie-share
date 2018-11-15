
// Import only what we need from express
import { User, UserDetails } from '../model';
import { Route, Get, Post, Body, Query, SuccessResponse, Response, Controller, Delete } from 'tsoa';
import { UserManager } from '../service';

@Route('users')
export class UserController extends Controller {

    @Response('500', 'Internal Server Error, when fails to connect to the DB')
    @SuccessResponse('200', 'List of all available users')
    @Get()
    public async getAllUsers(@Query() displayName?: string): Promise<User[]> {
        const users = await this.userManager.getAllUsers().toPromise();
        return users;
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
            userId: 'pr'
        };
        return user;
    }

    @Response('500', "If the username requested already exists")
    @Response('400', 'If any required fields are missing in the request')
    @SuccessResponse('201', 'Created')
    @Post()
    public async createUser(@Body() requestBody: UserDetails, ): Promise<any> {
        const data = await this.userManager.createUser(requestBody).toPromise();
        this.setStatus(201);
        return {
            userId: data
        };
    }

    private userManager: UserManager = new UserManager();
}