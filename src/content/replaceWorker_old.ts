type DocumentParams = {
  workerURL: string;
};

function toAbsoluteUrl(url: string): string {
  try {
    const Url = new URL(url, location.href);
    return Url.href;
  } catch {
    return url;
  }
}
const params = JSON.parse(
  document.currentScript!.dataset.params!
) as DocumentParams;

window.Worker = class Worker extends window.Worker {
  constructor(scriptURL: string | URL, options?: WorkerOptions) {
    const fullUrl = toAbsoluteUrl(scriptURL.toString());
    const isTwitchWorker = fullUrl.includes(".twitch.tv");
    if (!isTwitchWorker) {
      super(scriptURL, options);
      return;
    }
    let script = "";
    const xhr = new XMLHttpRequest();
    xhr.open("GET", scriptURL, true);
    xhr.send();
    if (200 <= xhr.status && xhr.status < 300) {
      script = xhr.responseText;
    } else {
      console.warn(`[TTV LOL PRO] Failed to fetch script: ${xhr.statusText}`);
      script = `importScripts('${fullUrl}');`; // Will fail on Firefox Nightly.
    }
    const newScript = `
    try {
        importScripts('${params.workerURL}');
     } catch(e) {
        console.error('HUGE ERROR:', e);
    }
     ${script}
     `;
    const newScriptURL = URL.createObjectURL(
      new Blob([newScript], { type: "text/javascript" })
    );
    const wrapperScript = `
    try {
      importScripts('${newScriptURL}');
    } catch (error) {
      console.warn('[TTV LOL PRO] Failed to wrap script: ${newScriptURL}:', error);
      ${newScript}
    }
  `;
    const wrapperScriptURL = URL.createObjectURL(
      new Blob([wrapperScript], { type: "text/javascript" })
    );

    super(wrapperScriptURL, options);
  }
};
