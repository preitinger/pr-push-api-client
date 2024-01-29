
/**
 * ask for permission for push messages.
 * If granted, register the service worker at serviceWorkerPath.
 * Then, registers a push subscription at the browser's push service.
 */
export async function pushApiStart(
    serviceWorkerPath: string,
    applicationServerKey: string,
    onMessage: (e: unknown) => void
): Promise<PushSubscription> {

    if (Notification.permission === 'denied') throw new Error('Notifications not permitted!');
    if (Notification.permission === 'default') {
        switch (await Notification.requestPermission()) {
            case 'granted':
                break;
            default:
                throw new Error('Notifications not permitted!');
        }
    }

    const oldRegs = await navigator.serviceWorker.getRegistrations();
    for (const oldReg of oldRegs) {
        await oldReg.unregister();
    }


    const registration = await navigator.serviceWorker.register(serviceWorkerPath);
    navigator.serviceWorker.onmessage = e => {
        onMessage(e);
    }
    try {
        return await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        });
    } catch (reason) {
        registration.unregister();
        throw reason;
    }
}


function askPermission(): Promise<NotificationPermission> {
    return new Promise<NotificationPermission>((resolve, reject) => {
        const permissionResult = Notification.requestPermission(function (result) {
            resolve(result);
        });

        if (permissionResult) {
            permissionResult.then(resolve, reject);
        }
    }).then(function (permissionResult) {
        if (permissionResult !== 'granted') {
            throw new Error("We weren't granted permission.");
        }
        return permissionResult
    });
}
