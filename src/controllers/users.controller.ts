
// Import only what we need from express
import { User } from '../model';
import { Route, Get, Post, Body, Query, SuccessResponse, Response, Controller } from 'tsoa';
import * as express from 'express';

@Route('users')
export class UserController extends Controller {

    @Response('500', 'Internal Server Error, when fails to connect to the DB')
    @SuccessResponse('200', 'List of all available users')
    @Get()
    public getAllUsers(@Query() displayName?: string): User[] {
        console.log("Get all users with display name: ", displayName);
        const users: User[] = [];
        const user = new User();
        user.displayName = 'PR';
        user.numberOfFriends = 10;
        user.profession = 'Student';
        user.profilePicUrl = '';
        user.userId = 'pr';
        users.push(user);
        return users;
    }

    @SuccessResponse('200', 'User with the specified id')
    @Response('404', 'Failed to find the user with the specified Id')
    @Response('500', 'Failed to connect to the DB server')
    @Get('{id}')
    public getUser(id: string): User {
        const user = new User();
        user.displayName = 'PR';
        user.numberOfFriends = 10;
        user.profession = 'Student';
        user.profilePicUrl = '';
        user.userId = 'pr';
        return user;
    }

    @Response('500', "If the username requested already exists")
    @Response('400', 'If any required fields are missing in the request')
    @SuccessResponse('201', 'Created')
    @Post()
    public createUser(@Body() requestBody: User): string {
        console.log("Creating user", requestBody);
        this.setStatus(201);
        return "1";
    }
}