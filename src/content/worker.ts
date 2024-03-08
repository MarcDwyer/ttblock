import { DocumentParams } from ".";

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
    console.log("replacing worker v2...");
    const fullURL = toAbsoluteUrl(scriptURL.toString());
    const isTwitchWorker = fullURL.includes("twitch");
    if (!isTwitchWorker) {
      super(scriptURL, options);
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open("GET", scriptURL, true);
    xhr.send();
    let script = "";
    if (200 <= xhr.status && xhr.status < 300) {
      script = xhr.responseText;
    } else {
      console.warn(`[TTV LOL PRO] Failed to fetch script: ${xhr.statusText}`);
      script = `importScripts('${fullURL}');`; // Will fail on Firefox Nightly.
    }
    const workerPageState = {
      scope: "worker",
    };
    const myScript = `
      const pageState = ${JSON.stringify(workerPageState)};
    try {
            importScripts("${params.replaceFetchURL}");
         } catch(e) {
          console.error(e)
         }
          ${script}
      `;
    const newScriptURL = URL.createObjectURL(
      new Blob([myScript], { type: "text/javascript" })
    );
    super(newScriptURL, options);
  }
};
