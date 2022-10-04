
// enum Countries {
//     GEO = { test: 1}
// }

export function mapCountryToFlag(countryCode: string) {
    const map = {
        GEO: '🇬🇪',
        TUR: '🇹🇷',
        ISR: '🇮🇱',
        UZB: '🇺🇿',
        GRC: '🇬🇷'
    }
    return map[countryCode];
}

export function mapCountry(countryString: string): string {
    const map = {
        "➡️ Турция": "TUR",
        "➡️ Греция": "GRC",
        "➡️ Грузия": "GEO",
        "➡️ Израиль": "ISR",
        "➡️ Узбекистан": "UZB"
    }
    return map[countryString];
}