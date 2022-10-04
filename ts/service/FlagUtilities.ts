export enum CountryCode {
    GEO,
    TUR,
    ISR,
    UZB,
    GRC
}

export const countries = [
    {code: 'GEO', flag: '🇬🇪', text: "Грузия", isActive: true},
    {code: 'TUR', flag: '🇹🇷', text: "Турция", isActive: true},
    {code: 'ISR', flag: '🇮🇱', text: "Израиль", isActive: true},
    {code: 'UZB', flag: '🇺🇿', text: "Узбекистан", isActive: true},
    {code: 'KAZ', flag: '🇰🇿', text: "Казахстан", isActive: true},
    {code: 'VNM', flag: '🇻🇳', text: "Вьетнам", isActive: true},

    {code: 'GRC', flag: '🇬🇷', text: "Греция", isActive: false}
]

export function mapCountryToFlag(countryCode: string): string {
    return countries.find(c => c.code === countryCode)?.flag;
}

export function mapCountry(countryString: string): string {
     return countries.find(c => c.text === countryString)?.code
}