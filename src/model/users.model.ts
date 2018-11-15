export interface UserDetails {
    userId?: string;
    email: string;
    displayName: string;
    profession: string;
    profilePicUrl: string;
}

export interface User extends UserDetails {
    numberOfFriends: number;
}