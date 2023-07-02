import { cache } from "@/services/cache";
import { appSession } from "@/services/session";

type Theme = "dark" | "light";

export class Themes {
    private themes: Theme[] = ["dark", "light"];

    private applyTheme(key?: Theme) {
        if (key === "dark") document.documentElement.classList.add("dark");
        else if (key === "light") document.documentElement.classList.remove("dark");
    }

    public setTheme(key: Theme = "light") {
        this.applyTheme(key);

        cache.set("config", "theme", key);
        if (appSession.user.settings) {
            appSession.user.settings.theme = key;
        }
    }

    public async load() {
        let theme = await cache.get("config", "theme");
        if (theme === undefined) {
            theme = appSession.user.settings?.theme;
        }
        this.applyTheme(theme as unknown as undefined | Theme);
    }

    public get keys() {
        return this.themes;
    }
}

const themes = new Themes();

export default themes;
