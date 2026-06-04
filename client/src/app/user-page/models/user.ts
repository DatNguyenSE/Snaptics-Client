export type RegisterCreds = {
    displayName: string;
    email: string;
    password: string
}

export type LoginCreds = {
    email: string;
    password: string
}

export type User = {
    id: string;
    displayName?: string;
    email: string;
    token: string;
    imageUrl?: string;
    roles: string[];
}