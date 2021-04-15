export class BaseClass {
    public name: LocaleString = {};
    
    public getName(language: string) {
        return this.name[language] ?? this.name.en ?? this.name[Object.keys(this.name)?.[0]];
    }

    public getTranslatedProperty(property: LocaleString | undefined, language: string) {
        if (property) {
            return property[language] ?? property.en ?? property[Object.keys(property)?.[0]];
        }
    }
}