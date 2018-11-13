export class User {
    public userId: string;
    public displayName: string;
    public profession: string;
    public profilePicUrl: string;
    public numberOfFriends: number;

    constructor() {
        this.userId = '';
        this.displayName = '';
        this.profession = '';
        this.profilePicUrl = '';
        this.numberOfFriends = 0;
    }
}

export interface UserCreateRequest {
    userName: string;
    email: string;
}