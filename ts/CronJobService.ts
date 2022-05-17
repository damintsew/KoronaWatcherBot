import {CronJob} from 'cron';
import {KoronaDao} from "./KoronaDao";
import {NotificationService} from "./dto/NotificationService";

export class CronJobService {

    cronJob: CronJob;
    notificationService: NotificationService

    constructor(notificationService: NotificationService) {
        this.notificationService = notificationService;
        this.cronJob = new CronJob('0 */1 * * * *', async () => {
            try {
                await this.action();
            } catch (e) {
                console.error(e);
            }
        });

        // Start job
        if (!this.cronJob.running) {
            this.cronJob.start();
        }
    }

    async action(): Promise<void> {
        console.log("Call Korona")
        await this.notificationService.process();

        console.log("End Call Korona")
    }

    stop() {
        if (this.cronJob.running) {
            this.cronJob.stop();
        }
    }
}
