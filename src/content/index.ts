import workerModule from "./worker?script&module";
import replaceFetchModule from "./replaceFetch?script&module";

import vaftModule from "./vaft?script&module";

type Document = {
  src: string;
  params: Record<string, any>;
};

export function inject(docs: Document[]) {
  for (const { src, params } of docs) {
    const script = document.createElement("script");
    script.src = src;

    script.dataset.params = JSON.stringify(params);
    (document.head || document.documentElement).prepend(script);
    script.onload = () => script.remove();
  }
}
function oldVAFT(): Document {
  const vaftURL = chrome.runtime.getURL(vaftModule);
  return {
    src: vaftURL,
    params: {},
  };
}
function newVAFT(): Document {
  const workerURL = chrome.runtime.getURL(workerModule);
  const replaceFetchURL = chrome.runtime.getURL(replaceFetchModule);

  const workerDoc = {
    src: workerURL,
    params: { replaceFetchURL },
  };
  return workerDoc;
}
function main() {
  inject([newVAFT()]);
}

main();
