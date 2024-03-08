import workerModule from "./worker?script&module";
import replaceFetchModule from "./replaceFetch?script&module";

import vaftModule from "./vaft?script&module";

type Script = {
  src: string;
  params: Record<string, any>;
};
async function loadScript({ src, params }: Script): Promise<void> {
  return new Promise((res) => {
    const script = document.createElement("script");
    script.src = src;

    script.dataset.params = JSON.stringify(params);
    (document.head || document.documentElement).prepend(script);
    script.onload = () => {
      res();
      script.remove();
    };
  });
}
export async function injectScripts(docs: Script[]) {
  return Promise.all(docs.map(loadScript));
}
function oldVAFT(): Script {
  const vaftURL = chrome.runtime.getURL(vaftModule);
  return {
    src: vaftURL,
    params: {},
  };
}
function newVAFT(): Script {
  const workerURL = chrome.runtime.getURL(workerModule);
  const replaceFetchURL = chrome.runtime.getURL(replaceFetchModule);

  const workerDoc = {
    src: workerURL,
    params: { replaceFetchURL },
  };
  return workerDoc;
}
function main() {
  injectScripts([newVAFT()]);
}

main();
