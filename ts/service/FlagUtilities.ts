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
    {code: 'MDA', flag: '🇲🇩', text: "Молдова", isActive: true},
    {code: 'TJK', flag: '🇹🇯', text: "Таджикистан", isActive: true},
    {code: 'KGZ', flag: '🇰🇬', text: "Киргизия", isActive: true},
    {code: 'AZE', flag: '🇦🇿', text: "Азербайджан", isActive: true},
    {code: 'KOR', flag: '🇰🇷', text: "Корея", isActive: true},
    {code: 'KOR', flag: '🇧🇾', text: "Белоруссия", isActive: true},

    {code: 'GRC', flag: '🇬🇷', text: "Греция", isActive: false}
]

export function mapCountryToFlag(countryCode: string): string {
    return countries.find(c => c.code === countryCode)?.flag;
}

export function mapCountry(countryString: string): string {
     return countries.find(c => c.text === countryString)?.code
}