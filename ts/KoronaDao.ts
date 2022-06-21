import {curly} from "node-libcurl";


export class KoronaDao {

    static async call(countryCode: string): Promise<number> {
        const { data } = await curly.get(`https://koronapay.com/transfers/online/api/transfers/tariffs?sendingCountryId=RUS&sendingCurrencyId=810&receivingCountryId=${countryCode}&receivingCurrencyId=840&paymentMethod=debitCard&receivingAmount=100000&receivingMethod=cash&paidNotificationEnabled=false`, {
            httpHeader: this.getHttpHeader()
        })
        console.log(data)

        if (data.length > 0) {
            return data[0].exchangeRate;
        }
        return null;
    }

    private static getHttpHeader() {
        return ['Accept: application/vnd.cft-data.v2.82+json',
            'Cookie: qpay-web/3.0_csrf-token-v2=b2bb20e3f466e04c072418df4dfd816f; _gali=changeable-field-input-amount; ROUTEID=7496d571b1f3cd20|YrIgn; tmr_reqNum=8; tmr_detect=0%7C1655840883331; _ym_visorc=w; tmr_lvid=adb9ecae73adb68a9bebd29868120140; tmr_lvidTS=1655460718477; _ga=GA1.2.1816909230.1655460717; _gid=GA1.2.1390409309.1655840877; qpay-web/3.0_locale=en-gb; _ym_isad=2; _ym_d=1655460718; _ym_uid=1655460718685417901; _gcl_au=1.1.196525764.1655460717',
            'Accept-Encoding: gzip, deflate, br',
            'Host: koronapay.com',
            'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15',
            'Accept-Language: en-gb',
            'Referer: https://koronapay.com/transfers/online/',
            'Connection: keep-alive',
            'x-csrf-token: b2bb20e3f466e04c072418df4dfd816f',
            'x-application: Qpay-Web/3.0'];
    }
}