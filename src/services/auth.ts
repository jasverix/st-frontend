/* eslint-disable no-console */
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/performance";
import "firebase/analytics";
import router from "@/router";
import api, { session } from "./api";
import { useStore } from "@/store";
import { SessionActionTypes } from "@/store/modules/session/action-types";
import { SessionMutationTypes } from "@/store/modules/session/mutation-types";
import { notify } from "./notify";
import { firebaseConfig } from "@/config";
import http from "./http";
import { cache } from "./cache";

firebase.initializeApp(firebaseConfig);

export const analytics = firebase.analytics();

export const a = firebase.auth;

function notInitialized() {
    throw Error("FIREBASE DID NOT INITIALIZE");
}

function invalidProvider() {    
    throw Error("INVALID PROVIDER");
}

if (!a) {
    notInitialized();
}

async function loginUser(auth: Auth, user: firebase.User): Promise<boolean> {
    if (user.emailVerified) {
        useStore()?.commit(SessionMutationTypes.ERROR, "");
        analytics.logEvent("login");
        return true;
    } else {
        useStore()?.commit(SessionMutationTypes.ERROR, "EMAIL_NOT_VERIFIED");
        router.push({name: "verify-email"});
        return false;
    }
}

const providers: {
    [key: string]: firebase.auth.AuthProvider;
} = {
    google: new a.GoogleAuthProvider(),
    twitter: new a.TwitterAuthProvider(),
    microsoft: (() => {
        const p = new a.OAuthProvider("microsoft.com");
        p.setCustomParameters({
            prompt: "consent",
        });
        return p;
    })(),
    facebook: new a.FacebookAuthProvider(),
    apple: (() => {
        const p = new a.OAuthProvider("apple.com");
        p.addScope("email");
        p.addScope("name");

        return p;
    })(),
};

class Auth {
    private accessToken = "";
    private expiresAt = 0;

    public errors = {
        createAccount: "",
    };
    
    public get emailVerified() {
        return a().currentUser?.emailVerified == true;
    }

    public get image() {
        return a().currentUser?.photoURL ?? "";
    }


    public get verificationEmailSent() {
        const storage = localStorage.getItem("verified_email_at");
        const verifiedAt = storage ? parseInt(storage) : undefined;

        const diff = new Date().getTime() - (verifiedAt ?? 0);
        if (verifiedAt && diff < 120000) {
            return true;
        }

        return false;
    }

    public set verificationEmailSent(value: boolean) {
        localStorage.setItem("verified_email_at", new Date().getTime().toString());
    }

    public async getProviders(email: string) {
        return await a().fetchSignInMethodsForEmail(email);
    }

    public async setDisplayName(name: string) {
        if (!a) {
            notInitialized();
        }
        await a().currentUser?.updateProfile({
            displayName: name,
        });
    }

    public async loginWithToken(token: string) {
        if (!a) {
            notInitialized();
        }

        await a().setPersistence(a.Auth.Persistence.LOCAL);

        const result = await a()
            .signInWithCustomToken(token);
        
        const user = result.user;

        if (user) {
            await loginUser(this, user);
        }
    }

    public async login(providerName: string) {
        if (!a) {
            notInitialized();
        }
        await a().setPersistence(a.Auth.Persistence.LOCAL);

        const provider = providers[providerName];

        if (!provider) {
            invalidProvider();
        }

        const result = await a()
            .signInWithPopup(provider);
        
        const user = result.user;

        if (user) {
            await loginUser(this, user);
        }
    }

    private switchCode(code: string) {
        switch (code) {
            case "auth/wrong-password":
                notify("error", "Wrong Password", "warning");
                useStore().commit(SessionMutationTypes.ERROR, "Wrong password");
                break;
            case "auth/too-many-requests":
                notify("error", "Too many requests. Wait a few minutes", "warning");
                return;
            case "auth/email-already-in-use": 
                notify("error", "Email already in use", "warning");
                alert("Email already in use");
                useStore().commit(SessionMutationTypes.ERROR, "Email already in use");
                return;
        }
    }

    public async forgotPassword(email: string) {
        if (!a) {
            notInitialized();
        }

        await session.resetPassword(email);
        notify("success", "Forgot Password", "success", "Check your email for the reset-link.");
    }

    public async loginWithEmailAndPassword(email: string, password: string, stayLoggedIn: boolean) {
        if (!a) {
            notInitialized();
        }
        if (stayLoggedIn) {
            await a().setPersistence(a.Auth.Persistence.LOCAL);
        } else {
            await a().setPersistence(a.Auth.Persistence.SESSION);
        }

        const result = await a()
            .signInWithEmailAndPassword(email, password)
            .catch(e => {
                this.switchCode(e.code);
                return;
            }) as firebase.auth.UserCredential;

        const user = result.user;

        if (user) {
            await loginUser(this, user);
        }
    }

    public async createEmailAndPasswordUser(email: string, password: string, displayName: string) {
        if (!a) {
            notInitialized();
        }

        // const methods = await a().fetchSignInMethodsForEmail(email);

        const result = await a()
            .createUserWithEmailAndPassword(email, password)
            .catch(e => {
                this.switchCode(e.code);
            });
        if (!result) return;

        const user = result.user;

        await user?.updateProfile({
            displayName,
        }).catch(e => {
            switch (e.code) {
                case "auth/too-many-requests":
                    notify("error", "Too many requests. Wait a few minutes", "warning");
                    return;
            }
        });

        if (user) {
            await this.sendLinkToEmail();
            return "VERIFICATION_EMAIL_SENT";
        }
        return "FAILED_SIGNIN";
    }

    public async resetPassword(oldPassword: string, password: string) {
        const user = a().currentUser;

        if (user) {
            try {
                await user.updatePassword(password);

                //console.log("updated password");
            }
            catch (e) {
                console.log(e);
                if (!user.email) throw new Error("No email found on account ???");

                await a().signInWithEmailAndPassword(user.email, oldPassword);

                await user.updatePassword(password);
            }
        }
    }

    public async sendLinkToEmail() {
        const user = a().currentUser;

        if (user && !this.verificationEmailSent) {
            this.verificationEmailSent = true;
            http.setToken(await user.getIdToken());
            await session.verifyEmail();
            router.push({name: "verify-email"});
        }
    }

    public async logout() {
        await a().signOut();
        localStorage.clear();
        cache.clearCache();
        window.location.replace("/");
    }

    public async verificationCode(code: string) {
        await a().applyActionCode(code);

        const user = a().currentUser;

        if (user?.emailVerified) {
            return "VERIFIED_EMAIL";
        }
        return "CODE_NOT_VALID";
    }

    public get isAuthenticated() {
        const user = a().currentUser;
        if (user?.emailVerified) {
            return true;
        }
        return false;
    }

    public async getToken() {
        const user = a().currentUser;
        if (user?.emailVerified) {
            const token = await user.getIdToken();
            localStorage.setItem("id_token", token);
            return token;
        }
    }

    public async setProfileImage(fileName: string, image: string) {
        if (!a) {
            notInitialized();
        }

        const url = await api.session.uploadImage(fileName, image);

        if (url) {
            await a().currentUser?.updateProfile({
                photoURL: url.image,
            });
        }
    }

    public get user() {
        return a()?.currentUser;
    }

    // public renderUi() {
    //     // eslint-disable-next-line @typescript-eslint/no-var-requires
    //     const firebaseui = require('firebaseui');

    //     const ui = new firebaseui.auth.AuthUI(a());

    //     ui.start('#firebase-auth-container', {
    //         signInOptions: [
    //             a.EmailAuthProvider.PROVIDER_ID,
    //             a.GoogleAuthProvider.PROVIDER_ID,
    //             a.FacebookAuthProvider.PROVIDER_ID,
    //         ],
    //         signInSuccessUrl: '/'
    //     })
    // }
}

const auth = new Auth();

a().onAuthStateChanged(async s => {
    if (s) {
        await useStore().dispatch(SessionActionTypes.SESSION_START);
    }
    const params = new URLSearchParams(window.location.search);
    const token = params.get("authToken");

    if (token) {
        await auth.loginWithToken(token);
    }

    useStore().commit(SessionMutationTypes.INITIALIZED);
});

export default auth;
