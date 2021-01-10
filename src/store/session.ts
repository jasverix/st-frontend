import api from '@/services/api'
import { InjectionKey } from 'vue'
import { createStore, Store } from 'vuex'
import auth from '@/services/auth'
import router from '@/router';

export interface Session {
    currentUser: User;
    isAuthenticated: boolean;
    languages: Language[];
}

type SocialLogin = {
    provider: string;
    stayLoggedIn: boolean;
};

export const sessionKey: InjectionKey<Store<Session>> = Symbol()

export const sessionStore = createStore<Session>({
    state: {
        currentUser: {} as User,
        isAuthenticated: false,
        languages: []
    },
    actions: {
        async socialLogin(state, obj: SocialLogin) {
            await auth.login(obj.provider, obj.stayLoggedIn);
            if (auth.isAuthenticated) {
                const user = await api.session.getCurrentUser();
                state.commit('currentUser', user);
                try {
                    api.items.getLanguages().then(languages => {
                        state.commit('languages', languages);
                    })
                } catch (e) {
                    console.log(e);
                }
                if (router.currentRoute.value.name == "login") {
                    if (state.getters.isAdmin) {
                        router.replace("/users");
                    } else {
                        router.replace("/about")
                    }
                }
            }
        },
        async loginWithEmailPassword({ getters, commit }, obj: {
            email: string;
            password: string;
            stayLoggedIn: boolean;
        }) {
            await auth.loginEmail(obj.email, obj.password, obj.stayLoggedIn);
            if (auth.isAuthenticated) {
                const user = await api.session.getCurrentUser();
                commit('currentUser', user);
                if (router.currentRoute.value.name == "login") {
                    if (getters.isAdmin) {
                        router.replace("/users");
                    } else {
                        router.replace("/dashboard")
                    }
                }
            }
        },
        async saveUser({ state }) {
            await api.session.saveUser(state.currentUser.settings);
        }
    },
    mutations: {
        currentUser(state, user: User) {
            state.currentUser = user;
        },
        logout(state) {
            state.isAuthenticated = false;
            state.currentUser = {} as User;
        },
        settings(state, settings: UserSettings) {
            state.currentUser.settings = settings;
        },
        languages(state, languages: Language[]) {
            state.languages = languages;
        }
    },
    getters: {
        currentUser(state) {
            return state.currentUser;
        },
        isAdmin(state) {
            return state.currentUser?.roles?.find(r => r.name == "administrator")?.id !== undefined;
        },
        languages(state) {
            return state.languages;
        }
    }
})