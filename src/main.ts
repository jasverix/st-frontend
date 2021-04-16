import { createApp } from "vue";
import App from "./App.vue";
import i18n from "./i18n";
import router from "./router";
import { sessionStore, sessionKey, usersStore, usersKey, songStore, songKey, stripeKey, stripeStore, notificationStore, notificationKey } from "./store";

createApp(App)
    //.use(store)
    .use(sessionStore, sessionKey)
    .use(usersStore, usersKey)
    .use(songStore, songKey)
    .use(stripeStore, stripeKey)
    .use(notificationStore, notificationKey)
    .use(router)
    .use(i18n)
    .mount("#app");
