
// Import only what we need from express
import { frModel, frBody, CustomError } from '../model';
import { Route, Get, Post, Body, Query, SuccessResponse, Response, Controller, Delete, Put } from 'tsoa';
import { frManager } from '../service';
import request = require('request');
import { Observable } from 'rxjs';

@Route()
export class FriendsController extends Controller {

    /**
     * Get all images that belong to an user, or are shared with the user
     * @param userId The user id
     * @param sharedBy If specified, get all images that have been shared by this user, with the current user
     * @param sharedWith If specified, get all images that the current user has shared with the specified user
     */
    @Response('404', 'The specified user was not found')
    @Response('500', 'Internal Server Error, when fails to connect to the DB')
    @SuccessResponse('200', 'List of all available users image') 
    @Get('users/{userId}/friendrequest')
    public async getAllFriendRequest(userId:string)
         :Promise<frModel[]> {
       try {
        const users = await this.frManager.getAllFriendRequest(userId).toPromise();
        return users;
          // const frmodel:frModel={dateOfRequest:new Date().getTime(),frId} ;
          //  return await this.frManager.createFr().toPromise();
        
        } catch (error) {
            let status = 500;
            console.error('Failed to get friendRequests for the user: ', error);

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

    @SuccessResponse('201', 'Created')
    @Post('friendrequest')
    public async CreateRequest(@Body() requestBody:frBody ): Promise<void> {
        try {
            const frmodel:frModel={dateOfRequest:String(new Date().getTime()),frId:'',fromUser:requestBody.fromUser,toUser:requestBody.toUser} ;
            var data = await this.frManager.createFr(frmodel).toPromise();
            this.setStatus(201);
        } catch (error) {
            console.error('Failed to create friendRequest: ', error);
            this.setStatus(500);
            throw new CustomError(500, error);
        }
    }

    @SuccessResponse('201', 'Created')
    @Put('friendrequest/{frId}')
    public async acceptFriendRequest(frId:string ): Promise<void> {
        try {
            //const frmodel:frModel={dateOfRequest:String(new Date().getTime()),frId:'',fromUser:requestBody.fromUser,toUser:requestBody.toUser} ;
            var data = await this.frManager.acceptFriendRequest(frId).toPromise();
            this.setStatus(200);
        } catch (error) {
            console.error('Failed to create friendRequest: ', error);
            this.setStatus(500);
            throw new CustomError(500, error);
        }
    }

    
    private frManager: frManager = new frManager();
}