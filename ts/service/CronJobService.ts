import {CronJob} from 'cron';
import {ThresholdNotificationService} from "./ThresholdNotificationService";
import {GlobalMessageAnnouncerService} from "./GlobalMessageAnnouncerService";
import {ScheduledNotificationService} from "./ScheduledNotificationService";
import {GarantexService} from "./GarantexService";
import {Container} from "typedi";
import {PaymentSubscriptionService} from "./PaymentSubscriptionService";

export class CronJobService {

    everySecondJob: CronJob;
    everyMinuteJob: CronJob;
    everyHourJob: CronJob;
    notificationService: ThresholdNotificationService
    scheduledNotificationService: ScheduledNotificationService
    messageAnouncerService: GlobalMessageAnnouncerService
        paymentSubscriptionService: PaymentSubscriptionService
    garantexService: GarantexService

    constructor(notificationService: ThresholdNotificationService,
                // public messageAnouncerService: MessageAnouncerService,
                scheduledNotificationService: ScheduledNotificationService,
                garantexService: GarantexService) {
        this.notificationService = notificationService;
        this.messageAnouncerService = Container.get(GlobalMessageAnnouncerService);
        this.paymentSubscriptionService = Container.get(PaymentSubscriptionService);
        this.scheduledNotificationService = scheduledNotificationService;
        this.garantexService = garantexService;
        this.everySecondJob = new CronJob('*/1 * * * * *', async () => {
            try {
                await this.secondAction();
            } catch (e) {
                console.error(e);
            }
        });
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
        if (!this.everySecondJob.running) {
            this.everySecondJob.start();
        }
        if (!this.everyMinuteJob.running) {
            this.everyMinuteJob.start();
        }
        if (!this.everyHourJob.running) {
            this.everyHourJob.start();
        }
    }

    async secondAction(): Promise<void> {
        console.log("Call Garantex")
        await this.garantexService.process()

        console.log("End Call Garantex")
    }

    async minuteAction(): Promise<void> {
        console.log("Call Korona")
        await this.notificationService.process();

        console.log("End Call Korona")
        await this.messageAnouncerService.persistMessage();
    }

    async hourAction(): Promise<void> {
        console.log("Hour")
        await this.scheduledNotificationService.process()
        await this.messageAnouncerService.globalMessageAnnounce();
        await this.paymentSubscriptionService.findOutdatedSubscriptionsAndNotifyUser();
    }

    stop() {
        if (this.everySecondJob.running) {
            this.everySecondJob.stop();
        }
        if (this.everyMinuteJob.running) {
            this.everyMinuteJob.stop();
        }
        if (this.everyHourJob.running) {
            this.everyHourJob.stop();
        }
    }
}
