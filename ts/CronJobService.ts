import {CronJob} from 'cron';
import {KoronaDao} from "./KoronaDao";
import {NotificationService} from "./dto/NotificationService";
import {MessageAnouncerService} from "./MessageAnouncerService";

export class CronJobService {

    cronJob: CronJob;
    notificationService: NotificationService
    messageAnouncerService: MessageAnouncerService

    constructor(notificationService: NotificationService, messageAnouncerService: MessageAnouncerService) {
        this.notificationService = notificationService;
        this.messageAnouncerService = messageAnouncerService;
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

        // await this.messageAnouncerService.persistMessage();
        // await this.messageAnouncerService.announce();
    }

    stop() {
        if (this.cronJob.running) {
            this.cronJob.stop();
        }
    }
}
