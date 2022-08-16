import {CronJob} from 'cron';
import {KoronaDao} from "../KoronaDao";
import {ThresholdNotificationService} from "./ThresholdNotificationService";
import {MessageAnouncerService} from "../MessageAnouncerService";
import {ScheduledNotificationService} from "./ScheduledNotificationService";

export class CronJobService {

    everyMinuteJob: CronJob;
    everyHourJob: CronJob;
    notificationService: ThresholdNotificationService
    scheduledNotificationService: ScheduledNotificationService
    messageAnouncerService: MessageAnouncerService

    constructor(notificationService: ThresholdNotificationService,
                messageAnouncerService: MessageAnouncerService,
                scheduledNotificationService: ScheduledNotificationService) {
        this.notificationService = notificationService;
        this.messageAnouncerService = messageAnouncerService;
        this.scheduledNotificationService = scheduledNotificationService;
        this.everyMinuteJob = new CronJob('0 */1 * * * *', async () => {
            try {
                await this.minuteAction();
            } catch (e) {
                console.error(e);
            }
        });
        this.everyHourJob = new CronJob('1 0 0/1 * * *', async () => {
            try {
                await this.hourAction();
            } catch (e) {
                console.error(e);
            }
        });

        // Start job
        if (!this.everyMinuteJob.running) {
            this.everyMinuteJob.start();
        }
        if (!this.everyHourJob.running) {
            this.everyHourJob.start();
        }
    }

    async minuteAction(): Promise<void> {
        console.log("Call Korona")
        await this.notificationService.process();

        console.log("End Call Korona")
        await this.messageAnouncerService.persistMessage();
        await this.messageAnouncerService.announce();
    }

    async hourAction(): Promise<void> {
        console.log("Hour")
        await this.scheduledNotificationService.process()
    }

    stop() {
        if (this.everyMinuteJob.running) {
            this.everyMinuteJob.stop();
        }
        if (this.everyHourJob.running) {
            this.everyHourJob.stop();
        }
    }
}
