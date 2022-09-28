import { CollectionItem, Lyrics } from "@/classes";
//import { CacheService } from "./cacheservice";
import { RedirectToCheckoutOptions } from "@stripe/stripe-js";
import { SessionRequest, SetupResponse } from "songtreasures-api/checkout";
import { IActivity, ICategory, ICollection, ICollectionItem, ApiContributor, ICopyright, ICountry, IGenre, ILyrics, ICustomCollection, ICustomCollectionEntry, ISettings, ISong, ISubscription, Format, ITag, ITheme, IUser, IMediaFile, PublicUser, ShareKey, IScripture, ITranslation, IBook, IChapter, IVerse, IInstrument, IAnalyticsItem } from "songtreasures-api";
import http from "./http";
import { Language } from "songtreasures";
import { IArticle, IArticleContent, IPublication } from "songtreasures-api/publications";

export const activity = {
    async getActivities() {
        return await http.get<IActivity[]>("api/Activity?limit=20");
    },
    async pushActivities(activities: IActivity[]) {
        return await http.post<IActivity[]>("api/Activity", activities.map(a => {
            return {
                type: a.type,
                itemId: a.itemId,
                loggedDate: a.loggedDate,
            };
        }));
    },
};

const modelService = <T>(endpoint: string) => {
    return {
        get: (id: string) => http.get<T>(`api/${endpoint}/${id}`),
        list: () => http.get<T[]>(`api/${endpoint}`),
    };
};

const buildUrl = (baseUrl: string, params: {
    [key: string]: boolean | string | null;
}) => {
    const query: string[] = [];
    for (const [key, value] of Object.entries(params)) {
        if (value != null) {
            query.push(`${key}=${value}`);
        }
    }
    if (query.length) {
        baseUrl += "?" + query.join("&");
    }
    return baseUrl;
};

export const instruments = modelService<IInstrument>("Instruments");

export const publications = {
    list(collectionId: string) {
        return http.get<IPublication[]>(`api/Collections/${collectionId}/Publications`);
    },
    get(publicationId: string) {
        return http.get<IPublication>(`api/Publications/${publicationId}`);
    },
    articles: {
        list(publicationId: string, withContent = false, language: string | null = null) {
            return http.get<IArticle[]>(buildUrl(`api/Publications/${publicationId}/Articles`, {
                withContent,
                language,
            }));
        },
        get(articleId: string, withContent = false, language: string | null = null) {
            return http.get<IArticle>(buildUrl(`api/Publications/Article/${articleId}`, {
                withContent, 
                language,
            }));
        },
        content(articleId: string, language: string | null = null) {
            return http.get<IArticleContent>(buildUrl(`api/Publications/Article/${articleId}/Content`, {
                language,
            }));
        },
    },
};

export const session = {
    async getCurrentUser() {
        return await http.get<IUser>("api/Session");
    },
    saveUser(settings: ISettings) {
        return http.patch<IUser>("api/Session", settings);
    },
    createUser(displayName: string) {
        return http.put("api/Session", { displayName });
    },
    uploadImage(fileName: string, base64Image: string) {
        return http.patch<{ image: string }>("api/Session/Image", { fileName, base64Image });
    },
    saveProfile(options: {
        gender?: string;
        birthDay?: string;
        address?: {
            addressLine: string;
            secondaryAddressLine: string;
            zipCode: number;
            city: string;
            country: string;
        };
    }, firstTimeRegistration = false) {
        return http.patch<IUser>("api/Session/Profile?firstTimeRegistration=" + firstTimeRegistration, options);
    },
    acceptPrivacyPolicy() {
        return http.get("api/Session/AcceptPolicies?privacyPolicy=true");
    },
    acceptTermsOfService() {
        return http.get("api/Session/AcceptPolicies?termsAndConditions=true");
    },
    verifyEmail() {
        return http.get("api/Session/VerifyEmail");
    },
    resetPassword(email: string) {
        return http.get("api/Session/ResetPassword/" + email, true);
    },
};

export const items = {
    getThemes() {
        return http.get<ITheme[]>("api/Themes");
    },
    getCountries() {
        return http.get<ICountry[]>("api/Countries");
    },
    getCopyrights() {
        return http.get<ICopyright[]>("api/Copyrights");
    },
    getCategories() {
        return http.get<ICategory[]>("api/SongTags");
    },
    getGenres() {
        return http.get<IGenre[]>("api/Genres");
    },
    getLanguages() {
        return http.get<Language[]>("api/Languages");
    },
    getTranslations(languages: string[]) {
        return http.get<{
            [key: string]: {
                [key: string]: string;
            };
        }>("api/Localization?languages=" + languages.join(","), true);
    },
};

export const admin = {
    async getAllSubscriptions() {
        return await http.get<ISubscription[]>("api/Admin/Subscriptions");
    },
    getUsers(query: string) {
        return http.get<IUser[]>("api/Admin/Users?query=" + query);
    },
    getUsersWithRoles() {
        return http.get<IUser[]>("api/Admin/RoleAssignments");
    },
    getUser(uid: string) {
        return http.get<IUser>("api/Admin/User/" + uid);
    },
    createSubscription(uid: string, options: {
        collectionIds: string[];
        validTo: string;
    }) {
        return http.post<ISubscription, unknown>(`api/Admin/User/${uid}/Subscriptions`, options);
    },
    deleteSubcription(uid: string, subscriptionId: string) {
        return http.delete(`api/Admin/User/${uid}/Subscriptions/${subscriptionId}`);  
    },
    getRoles() {
        return http.get<string[]>("api/Admin/Roles");
    },
    setRoles(user: IUser, roles: string[]) {
        return http.patch<IUser>(`api/Admin/User/${user.id}/Roles`, roles);
    },
    clearCache(collectionId: string) {
        return http.get<string>(`api/Admin/ClearCache/${collectionId}`);
    },
    importFromLandax() {
        return http.get<string>("api/Admin/Import");
    },
    clearLandaxCache() {
        return http.get<string>("api/Admin/ClearCache/Landax");
    },
    sync() {
        return http.get<{ result: string }>("api/Admin/Sync");
    },
    emailLookup(email: string) {
        return http.post<{
            userId: {
                [key: string]: string;
            };
            stripeStatus: string[];
            firebaseStatus: string[];
            user: IUser;
            firebaseSubscriptions: ISubscription[];
            stripeSubscriptions: ISubscription[];
        }>("api/Admin/EmailLookup", {
            email,
        });
    },
    getEmails(createdAt: Date) {
        return http.get<string>("api/Admin/Emails?createdAt=" + createdAt.toISOString());
    },
    exportSubtitles(collection: string, codepage?: number, languages?: string[], replaceLyrics?: {
        [key: string]: {
            [key: number]: string;
        }
    }) {
        return http.apifetch(`api/Admin/Subtitles/${collection}?codepage=${codepage ?? ""}&languages=${languages?.join(",") ?? ""}`, {headers: {"content-type": "application/json"}, method: "post", body: JSON.stringify(replaceLyrics)}, false, false);
    },
};

export const songs = {
    getSongById(songId: string, expand?: string) {
        return http.get<ISong>("api/Songs/Id/" + songId + (expand ? "?expand=" + expand : ""));
    },
    getCollections() {
        return http.get<ICollection[]>("api/Collections?allCollections=true");
    },
    getAllSongs(collectionIds: string[], lastUpdated?: string) {
        return http.getWithResult<ISong[]>(`api/Songs?collections=${collectionIds.join(",")}&expand=details,transpositions` + (lastUpdated && new Date(lastUpdated) > new Date("2021-01-01")  ? "&updatedAt=" + lastUpdated : ""));
    },
    getFiles(lastUpdated?: string) {
        return http.getWithResult<IMediaFile[]>("api/Files" + (lastUpdated && new Date(lastUpdated) > new Date("2021-01-01") ? "?updatedAt=" + lastUpdated : ""));
    },
    getFile(fileId: string) {
        return http.get<IMediaFile>(`api/Files/${fileId}?expand=song`);
    },
    getSongFiles(songId: string) {
        return http.get<IMediaFile[]>(`api/Files?songId=${songId}&type=sheetmusic-pdf`);
    },
    getSongLyrics(songId: string, language: string, format: Format, transpose: number, transcode: string, newMelody = false) {
        return http.get<ILyrics>(`api/Songs/${songId}/Lyrics?language=${language}&format=${format}&transpose=${transpose}&transcode=${transcode}&newMelody=${newMelody}`);
    },
    async getLyrics(collection: ICollection, number: number, language: string, format: string, transpose: number, transcode: string, newMelody = false) {
        return new Lyrics(await http.get<ILyrics>(`api/Lyrics/${collection.id}/${number}?language=${language}&format=${format}&transpose=${transpose}&transcode=${transcode}&newMelody=${newMelody}`));
    },
    async getAllLyrics(collection: ICollection, language: string, format: string, transpose: number, lastUpdated?: string) {
        const uri = `api/Lyrics/${collection.id}?language=${language}&format=${format}&transpose=${transpose}` + (lastUpdated ? `&updatedAt=${lastUpdated}` : "");
        return (await http.get<ILyrics[]>(uri)).map(l => new Lyrics(l));
    },
    async getContributor(id: string) {
        return new CollectionItem((await http.get<ICollectionItem<ApiContributor>>(`api/Contributor/${id}?expand=item/biography,songs/collection`)));
    },
    getContributors(lastUpdated?: string) {
        return http.getWithResult<ICollectionItem<ApiContributor>[]>("api/Contributors" + (lastUpdated && new Date(lastUpdated) > new Date("2021-01-01")  ? "?updatedAt=" + lastUpdated : ""));
    },
    creditSong(collectionId: string, number: number, language: string, content: string, fileExtension: string) {
        return http.uploadAndDownload(`api/Songs/Credit?collectionId=${collectionId}&number=${number}&language=${language}&fileExtension=${fileExtension}`, content);
    },
};

export const favorites = {
    get() {
        return http.get<string[]>("api/Favorites");
    },
    add(ids: string[]) {
        return http.post<void, unknown>("api/Favorites", ids);
    },
    delete(ids: string[]) {
        return http.delete<void>("api/Favorites", ids);
    },
};

export const playlists = {
    async getPlaylists() {
        return (await http.get<ICustomCollection[]>("api/Playlists"));
    },
    async getPlaylist(id: string) {
        return (await http.get<ICustomCollection>("api/Playlists/" + id));
    },
    async createPlaylist(name: string) {
        return await http.post<ICustomCollection, unknown>("api/Playlists", {name});
    },
    deletePlaylist(id: string): Promise<void> {
        return http.delete(`api/Playlists/${id}`);
    },
    async addToPlaylist(playlistId: string, songId: string, transposition?: number) {
        return await http.post<ICustomCollectionEntry[], unknown>(`api/Playlists/${playlistId}`, {
            songIds: [songId],
            transposition,
        });
    },
    async removeEntryFromPlaylist(playlistId: string, entryId: string) {
        return (await http.post<ICustomCollection, unknown>(`api/Playlists/${playlistId}`, {
            removeEntryIds: [entryId],
        }));
    },
    getUsers(playlistId: string) {
        return http.get<PublicUser[]>("api/Playlists/" + playlistId + "/Users");
    },
    deleteUser(playlistId: string, userId: string) {
        return http.delete(`api/Playlists/${playlistId}/Users/${userId}`);
    },
    updatePlaylist(playlistId: string, options: {
        name?: string;
        entryOrder?: string[];
    }) {
        return http.patch(`api/Playlists/${playlistId}`, options);
    },
};

export const sharing = {
    getKeys() {
        return http.get<ShareKey[]>("api/Sharing");
    },
    shareItem(itemId: string, type: "playlist" | "tag") {
        return http.put<ShareKey, unknown>("api/Sharing", {
            itemId,
            type,
        });
    },
    deleteKey(key: string) {
        return http.delete("api/Sharing/" + key);
    },
    activateKey(key: string) {
        return http.post<ICustomCollection | ITag>("api/Sharing/" + key);
    },
};

export const analytics = {
    getForSong(songId: string, fromDate: Date, toDate?: Date) {
        return http.get<IAnalyticsItem>("api/Analytics/" + songId + `?fromDate=${fromDate.toISOString()}` + (toDate ? `&toDate=${toDate?.toISOString()}` : ""));
    },
    viewSong(songId: string) {
        return http.post<number>("api/Analytics/View/" + songId);
    },
    getMostViewed() {
        return http.get<{[key: string]: number}>("api/Analytics/MostViewed");
    },
    getTotalViews() {
        return http.get<{[key: string]: number}>("api/Analytics/Views");
    },
};

export const tags = {
    getAll() {
        return http.get<ITag[]>("api/Tags");
    },
    get(id: string) {
        return http.get<ITag>("api/Tags/" + id);
    },
    create(name: string, color: string | null, songId: string) {
        return http.post<ITag, unknown>("api/Tags", {name, color, songId});
    },
    update(id: string, name?: string, color?: string, addIds?: string[], removeIds?: string[]) {
        return http.patch("api/Tags/" + id, {
            name,
            color,
            addIds,
            removeIds,
        });
    },
    delete(id: string){
        return http.delete(`api/Tags/${id}`);
    },
};

export const stripe = {
    setup() {
        return http.get<SetupResponse>("api/Store/Setup");
    },
    async startSession(productIds: string[], type: "year" | "month") {
        const country = await http.getCountry().catch(() => {
            return undefined;
        });

        return await http.post<RedirectToCheckoutOptions, SessionRequest>("api/Store/Session", {
            productIds,
            cancelUrl: window.location.href,
            successUrl: window.location.origin + "/success",
            country,
            type,
        });
    },
    getSession(sessionId: string) {
        return http.get<RedirectToCheckoutOptions>(`api/Store/Session/${sessionId}`);
    },
    getPortalSession() {
        return http.post("api/Store/Portal", {
            returnUrl: window.location.href,
        });
    },
    refreshSubscriptions() {
        return http.get("api/Store/Refresh");
    },
};

export const scriptures = {
    getAll() {
        return http.get<IScripture[]>("api/Scriptures");
    },
    getScripture(id: string) {
        return http.get<IScripture>("api/Scriptures/" + id);
    },
    getTranslations(scriptureId: string) {
        return http.get<ITranslation[]>(`api/Scriptures/${scriptureId}/Translations`);
    },
    getTranslation(id: string) {
        return http.get<ITranslation>(`api/Scriptures/Translation/${id}`);
    },
    getBooks(translationId: string) {
        return http.get<IBook[]>(`api/Scriptures/Translation/${translationId}/Books`);
    },
    getBook(bookId: string) {
        return http.get<IBook[]>(`api/Scriptures/Book/${bookId}`);
    },
    getChapters(bookId: string, includeChildren = false, includePreview = true) {
        return http.get<IChapter[]>(`api/Scriptures/Book/${bookId}/Chapters?includeChildren=${includeChildren}&includePreview=${includePreview}`);
    },
    getChapter(chapterId: string, includeChildren = false, includePreview = true) {
        return http.get<IChapter>(`api/Scriptures/Chapter/${chapterId}?includeChildren=${includeChildren}&includePreview=${includePreview}`);
    },
    getVerses(chapterId: string, to?: number, from?: number) {
        return http.get<IVerse[]>(`api/Scriptures/Chapter/${chapterId}/Verses?to=${to ?? ""}&from=${from ?? ""}`);
    },
};

export default {
    session,
    admin,
    songs,
    items,
    stripe,
    playlists,
    activity,
    tags,
    analytics,
    scriptures,
};
