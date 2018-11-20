export interface UserDetails {
    displayName: string;
    email: string;
    profession: string;
    profilePicUrl: string;
    description: string;
    age: number;    
}

export interface UserCreateRequest extends UserDetails {
    password: string;
}

export interface User extends UserDetails {
    numberOfFriends: number;
}