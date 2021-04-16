import { Collection } from "@/classes";
import { RootState } from "../..";
import { GetterTree } from "vuex";
import { State } from "./state";
import { ApiPlaylist } from "dmb-api";


export type Getters = {
    collections(state: State): Collection[];
    user(state: State): User | undefined;
    initialized(state: State): boolean;
    isAdmin(state: State): boolean;
    languageKey(state: State): string;
    extended(state: State): boolean;
    playlists(state: State): ApiPlaylist[];
}

export const getters: GetterTree<State, RootState> & Getters = {
    collections(state): Collection[] {
        if (state.currentUser) {
            if (state.currentUser.roles.some(r => ["administrator", "extended"].includes(r))) {
                return state.collections;
            }
            const subscriptions = state.currentUser.subscriptions;
            return state.collections.filter(c => subscriptions
                .map(s => s.collectionIds)
                .some(i => i.includes(c.id)));
        } else {
            return [];
        }
    },
    user(state) {
        return state.currentUser;
    },
    initialized(state) {
        return state.initialized;
    },
    isAdmin(state): boolean {
        return state.currentUser?.roles.includes("administrator") == true;
    },
    languageKey(state): string {
        return state.currentUser?.settings?.languageKey ?? "en";
    },
    extended(state): boolean {
        return state.currentUser?.roles.some(r => r == "administrator" || r == "extended") == true;
    },
    playlists(state): ApiPlaylist[] {
        return state.playlists;
    },
};
