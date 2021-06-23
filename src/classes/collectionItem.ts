import { ApiCollectionItem, ApiContributor } from "dmb-api";
import { Tag } from "./tag";

export class CollectionItem<T extends (ApiContributor | Country | Theme | Tag)> implements ApiCollectionItem<T> {
    public id;
    public item: T;
    public songIds;
    public songs?;
    public fileIds;
    public files?;

    constructor(item: ApiCollectionItem<T>) {
        this.id = item.id;
        this.item = item.item;
        this.songIds = item.songIds;
        this.songs = item.songs;
        this.fileIds = item.fileIds;
        this.files = item.files;
    }
}
