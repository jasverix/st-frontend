import { RedirectToCheckoutOptions } from '@stripe/stripe-js';
import { SessionRequest, SetupResponse } from 'checkout';
import auth from './auth';
import http from './http';

export const session = {
    getVersion() {
        return http.get<string>('version', false)
    },
    async login() {
        return await auth.login()
    },
    async getCurrentUser() {
        return await http.get<User>('api/Session')
    },
    isAuthenticated: auth.isAuthenticated,
    async startSession() {
        return await auth.login();
    },
    saveUser(settings: UserSettings) {
        return http.patch('api/Session/Save', settings)
    }
}

export const items = {
    getLanguages() {
        return http.get<Language[]>('api/Languages');
    }
}

export const admin = {
    async getAllSubscriptions() {
        return await http.get<Subscription[]>('api/Admin/Subscriptions');
    },
    getAllUsers() {
        return http.get<User[]>('api/Admin/Users');
    },
    getRoles() {
        return http.get<string[]>('api/Admin/Roles');
    },
    setRoles(user: User, roles: string[]) {
        return http.patch<User>(`api/Admin/User/${user.id}/Roles`, roles);
    }
}

export const songs = {
    getCollections() {
        return http.get<Collection[]>('api/Collections');
    },
    getAllSongs(collection: string) {
        return http.get<SongInterface[]>(`api/Songs/${collection}`);
    },
    getLyrics(collection: string, number: number, language: string, format: string, transpose: number) {
        return http.get<LyricsInterface>(`api/Lyrics/${collection}/${number}?language=${language}&format=${format}&transpose=${transpose}`);
    },
    getAllLyrics(collection: string, language: string, format: string, transpose: number) {
        return http.get<LyricsInterface[]>(`api/Lyrics/${collection}?language=${language}&format=${format}&transpose=${transpose}`);
    }
}

export const stripe = {
    setup() {
        return http.get<SetupResponse>('api/Store/Setup')
    },
    startSession(priceId: string) {
        return http.post<RedirectToCheckoutOptions, SessionRequest>(`api/Store/Session`, { priceId })
    },
    getSession(sessionId: string) {
        return http.get<RedirectToCheckoutOptions>(`api/Store/Session/${sessionId}`)
    }
}

const api = {
    session,
    admin,
    songs,
    items,
}

export default api
