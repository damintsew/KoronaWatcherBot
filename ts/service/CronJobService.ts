import {CronJob} from 'cron';
import {ThresholdNotificationService} from "./ThresholdNotificationService";
import {GlobalMessageAnnouncerService} from "./GlobalMessageAnnouncerService";
import {ScheduledNotificationService} from "./ScheduledNotificationService";
import {GarantexService} from "./GarantexService";
import {PaymentSubscriptionService} from "./PaymentSubscriptionService";
import {UserCleanerService} from "./UserCleanerService";
import {Service} from "typedi";
import {BinanceService} from "./BinanceService";
import {UnistreamService} from "./external/UnistreamService";

@Service()
export class CronJobService {

    everySecondJob: CronJob;
    everyFiveJob: CronJob;
    everyHourJob: CronJob;

    notificationService: ThresholdNotificationService
    scheduledNotificationService: ScheduledNotificationService
    messageAnouncerService: GlobalMessageAnnouncerService
    paymentSubscriptionService: PaymentSubscriptionService
    userCleanerService: UserCleanerService

    garantexService: GarantexService
    binanceService: BinanceService
    unistreamService: UnistreamService

    constructor(notificationService: ThresholdNotificationService,
                messageAnnouncerService: GlobalMessageAnnouncerService,
                paymentSubscriptionService: PaymentSubscriptionService,
                userCleanerService: UserCleanerService,
                scheduledNotificationService: ScheduledNotificationService,
                garantexService: GarantexService,
                binanceService: BinanceService,
                unistreamService: UnistreamService) {
        this.notificationService = notificationService;

        this.messageAnouncerService = messageAnnouncerService;
        this.paymentSubscriptionService = paymentSubscriptionService;
        this.userCleanerService = userCleanerService

        this.scheduledNotificationService = scheduledNotificationService;

        this.garantexService = garantexService;
        this.binanceService = binanceService;
        this.unistreamService = unistreamService;
        this.everySecondJob = new CronJob('30 * * * * *', async () => {
            try {
                await this.secondAction();
            } catch (e) {
                console.error(e);
            }
        });
        this.everyFiveJob = new CronJob('0 */5 * * * *', async () => {
            try {
                await this.minuteAction();
            } catch (e) {
                console.error(e);
            }
        });
        this.everyHourJob = new CronJob('1 10 0/1 * * *', async () => {
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
        if (!this.everyFiveJob.running) {
            this.everyFiveJob.start();
        }
        if (!this.everyHourJob.running) {
            this.everyHourJob.start();
        }
    }

    async secondAction(): Promise<void> {
        console.log("Call Garantex")
        await this.garantexService.process()
        await this.binanceService.getAndSaveRate()
        this.unistreamService.getAndSaveRates()
            .catch(console.error)

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
        this.scheduledNotificationService.process()
            .catch(console.error)
        this.messageAnouncerService.globalMessageAnnounce()
            .catch(console.error)
        this.paymentSubscriptionService.findOutdatedSubscriptionsAndNotifyUser()
            .catch(console.error)
    }

    stop() {
        if (this.everySecondJob.running) {
            this.everySecondJob.stop();
        }
        if (this.everyFiveJob.running) {
            this.everyFiveJob.stop();
        }
        if (this.everyHourJob.running) {
            this.everyHourJob.stop();
        }
    }
}
