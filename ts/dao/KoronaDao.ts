import axios from "axios";
import {env} from "node:process";

interface KoronaResponse {
    country: string,
    value: number
}

const koronaApiUrl = env.KORONA_API_URL
if (koronaApiUrl === undefined) {
    throw new Error('koronaApiUrl must be provided!')
}

export class KoronaDao {

    static async call(countryCode: string): Promise<number> {
        console.log(`Requesting data for country ${countryCode}`)
        try {
            let {data} = await axios.get(`${koronaApiUrl}/korona/${countryCode}`);
            console.log("Received data: " + data)
            return data.value

        } catch (err) {
            console.log(err);
            return null
        }
    }
}
