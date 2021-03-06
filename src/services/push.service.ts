import { PushRegistration } from "@aerogear/push";
import { Injectable } from "@angular/core";
import { Push, PushObject } from "@ionic-native/push";
import { PushMessage } from "../pages/pushMessages/message";

const PUSH_ALIAS = "cordova";

/**
 * Handles interactions with the push plugin and provides an easy interface
 * to register and unregister from push notifications
 */
@Injectable()
export class PushService {
  public static registered: boolean = false;

  // We want one single instance & callback app wide
  public static pushObject: PushObject = null;
  public static callback: (notification: PushMessage) => void;

  public messages: PushMessage[] = [];
  private pushError: Error;

  public initPush() {
    PushService.pushObject = new Push().init({
      android: {},
      ios: {
        alert: true,
        badge: true,
        sound: true,
      },
    });
  }

  public emit(notification: PushMessage) {
    if (PushService.callback) {
      PushService.callback(notification);
    }
  }

  // The callback will be triggered when a push notificatoin is received
  public setCallback(cb: (notification: PushMessage) => void) {
    PushService.callback = cb;
  }

  // No longer receive notifications
  public unregister() {
    PushService.pushObject.unregister().then(() => {
      PushService.registered = false;
      console.info("Successfully unregistered");
    }).catch(() => {
      console.error("Error unregistering");
    });
  }

  public register() {
    PushService.pushObject.on("error").subscribe((err) => {
      this.pushError = err;
      console.error(`Error configuring push notifications ${err.message}`);
    });

    // Invokes the UPS registration endpoint
    PushService.pushObject.on("registration").subscribe((data) => {
      new PushRegistration().register(data.registrationId, PUSH_ALIAS).then(() => {
        PushService.registered = true;
        console.info("Push registration successful");
      }).catch((err) => {
        this.pushError = err;
        console.error("Push registration unsuccessful ", this.pushError);
      });
    });

    PushService.pushObject.on("notification").subscribe((notification) => {
      const newNotification = {
        message: notification.message,
        received: new Date().toDateString(),
      };
      this.messages.push(newNotification);
      this.emit(newNotification);
    });
  }

  public getError() {
    return this.pushError;
  }

  public isRegistered() {
    return PushService.registered;
  }
}
