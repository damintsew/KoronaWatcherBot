import {Context, Scenes} from "telegraf";
import {SubscriptionData} from "./entity/SubscriptionData";
import {User} from "./entity/User";
import {SubscriptionThresholdData} from "./entity/SubscriptionThresholdData";

/**
 * Now that we have our session object, we can define our own context object.
 *
 * As always, if we also want to use our own session object, we have to set it
 * here under the `session` property. In addition, we now also have to set the
 * scene object under the `scene` property. As we extend the scene session, we
 * need to pass the type in as a type variable once again.
 *
 * We also have to set the wizard object under the `wizard` property.
 */
export interface MyContext extends Context {
    // will be available under `ctx.myContextProp`
    myContextProp: string

    // declare session type
    session: MySession
    // declare scene type
    scene: Scenes.SceneContextScene<MyContext, MyWizardSession>
    // declare wizard type
    wizard: Scenes.WizardContextWizard<MyContext>
}

/**
 * It is possible to extend the session object that is available to each wizard.
 * This can be done by extending `WizardSessionData` and in turn passing your
 * own interface as a type variable to `WizardSession` and to
 * `WizardContextWizard`.
 */
export interface MyWizardSession extends Scenes.WizardSessionData {
    // will be available under `ctx.scene.session.myWizardSessionProp`
    subscriptionData: SubscriptionThresholdData | SubscriptionData
    activeSubscriptions: Array<SubscriptionData>
    timeSelectionButtons: { } //todo make typed array

    country: string
}

/**
 * We can still extend the regular session object that we can use on the
 * context. However, as we're using wizards, we have to make it extend
 * `WizardSession`.
 *
 * It is possible to pass a type variable to `WizardSession` if you also want to
 * extend the wizard session as we do above.
 */
export interface MySession extends Scenes.WizardSession<MyWizardSession> {
    // will be available under `ctx.session.isUserSaved`
    isUserSaved: boolean
    user: User
}
