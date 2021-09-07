import { User } from "@/classes/user";


export type State = {
    users: User[];
    roles: string[];
}

export const state: State = {
    users: [],
    roles: [],
};
