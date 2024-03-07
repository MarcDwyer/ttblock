const realFetch = fetch;

enum Signifier {
  Ad = "stitched",
}

interface MediaSegment {
  duration: number;
  url: string;
}

function parseM3U8(m3u8Content: string): MediaSegment[] {
  const lines = m3u8Content.trim().split("\n");
  const segments: MediaSegment[] = [];
  let duration: number | null = null;
  let url: string | null = null;

  for (const line of lines) {
    if (line.startsWith("#EXTINF:")) {
      // Extract duration from #EXTINF line
      duration = parseFloat(line.substring("#EXTINF:".length).split(",")[0]);
    } else if (line.trim() !== "" && line.startsWith("http")) {
      // If line starts with 'http' it's assumed to be the URL
      url = line.trim();
      // If both duration and URL are found, add segment to the array
      if (duration !== null && url !== null) {
        segments.push({ duration, url });
        // Reset duration and URL for the next segment
        duration = null;
        url = null;
      }
    }
  }

  return segments;
}

async function getTs(mediaSeg: MediaSegment) {
  try {
    const tsResp = await realFetch(mediaSeg.url);
    console.log({ tsResp: await tsResp.text() });
  } catch (e) {
    console.error(e);
  }
}

const flaggedReq = new Set();
const tsSet = new Set();

let UsherData = {};

async function hookFetch(
  url: RequestInfo | URL,
  init: RequestInit | undefined
) {
  const urlStr = url.toString();

  if (urlStr.includes("video-weaver")) {
    const resp = await realFetch(url, init);
    const txt = await resp.text();
    const tsDests = parseM3U8(txt);
    const channelNames = new URL(url.toString()).pathname.match(
      /([^\/]+)(?=\.\w+$)/
    );
    if (channelNames && channelNames.length) {
      console.log({ channelName: channelNames[0] });
    }
    for (const { url } of tsDests) {
      if (tsSet.has(url)) {
        console.log("same m3u8 already found");
      }
      tsSet.add(url);
    }
    // if (tsDest.length) {
    //   getTs(tsDest[0]);
    // }
    if (txt.includes(Signifier.Ad)) {
      console.log("AD DETECTED", { txt, tsSet });
    }
    return new Response(txt);
  } else if (urlStr.includes("/api/channel/hls/")) {
    // const url1 = new URL(url.toString());
    const fullURL = new URL(urlStr);
    const channelName = fullURL.pathname.match(/([^\/]+)(?=\.\w+$)/);
    const usherParams = fullURL.search;
    UsherData = {
      channelName,
      params: usherParams,
    };
    console.log({ UsherData });
  }
  return realFetch(url, init);
}
self.fetch = hookFetch;
