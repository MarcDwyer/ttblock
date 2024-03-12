const realFetch = fetch;

enum Signifier {
  Ad = "stitched",
}

interface MediaSegment {
  duration: number;
  url: string;
}
function parseAttributes(str) {
  return Object.fromEntries(
    str
      .split(/(?:^|,)((?:[^=]*)=(?:"[^"]*"|[^,]*))/)
      .filter(Boolean)
      .map((x) => {
        const idx = x.indexOf("=");
        const key = x.substring(0, idx);
        const value = x.substring(idx + 1);
        const num = Number(value);
        return [
          key,
          Number.isNaN(num)
            ? value.startsWith('"')
              ? JSON.parse(value)
              : value
            : num,
        ];
      }),
  );
}

let UsherData = {};

type M3U8Info = Map<
  string,
  {
    resolution: string;
    frameRate: string;
  }
>;
type StreamInfo = {
  channelName: string;
  weaverInfo: WeaverInfoMap;
};

type CreateStreamInfoParams = {
  channelName: string;
  resolution: string;
  frameRate: string;
};
const createStreamInfo = ({ channelName }: CreateStreamInfoParams) => ({
  channelName,
  weaverInfo: new Map() as WeaverInfoMap,
});
type M3U8Data = { m3u8: string; resolution: string; frameRate: string };

type UsherInfoInsert = {
  channelName: string;
  m3u8s: M3U8Data[];
};
type UsherChannelsValue = {
  urls: Map<
    string,
    {
      resolution: string;
      frameRate: string;
    }
  >;
  channelName: string;
};
const createUsherChannelsValue = (channelName: string): UsherChannelsValue => ({
  urls: new Map(),
  channelName,
});
class UsherInfo {
  channels: Map<string, UsherChannelsValue> = new Map();
  insertURL({ channelName, m3u8s }: UsherInfoInsert) {
    const channel =
      this.channels.get(channelName) ?? createUsherChannelsValue(channelName);

    for (const { m3u8, frameRate, resolution } of m3u8s) {
      channel.urls.set(m3u8, { resolution, frameRate });
    }
    this.channels.set(channelName, channel);
    return channel;
  }
  async handleRequest(url: string) {
    const fullURL = new URL(url);
    const channelName: string =
      fullURL.pathname.match(/([^\/]+)(?=\.\w+$)/)?.[0] ?? "";
    const usherParams = fullURL.search;
    UsherData = {
      channelName,
      params: usherParams,
    };
    const usherm3u8Resp = await realFetch(url);
    const usherm3u8Txt = await usherm3u8Resp.text();
    const lines = usherm3u8Txt.replace("\r", "").split("\n");

    const m3u8s: M3U8Data[] = [];
    lines.forEach((line, index) => {
      if (!line.startsWith("#") && line.includes(".m3u8")) {
        if (index > 0 && lines[index - 1].startsWith("#EXT-X-STREAM-INF")) {
          const attributes = parseAttributes(lines[index - 1]);
          const resolution = attributes["RESOLUTION"];
          const frameRate = attributes["FRAME-RATE"];
          if (resolution) {
            m3u8s.push({
              m3u8: lines[index - 1],
              resolution,
              frameRate,
            });
          }
        }
        return usherm3u8Resp;
      }
    });
    return this.insertURL({ m3u8s, channelName });
  }
}
const usherInfo = new UsherInfo();
async function hookFetch(
  url: RequestInfo | URL,
  init: RequestInit | undefined,
) {
  const urlStr = url.toString();
  if (urlStr.includes("video-weaver")) {
    const resp = await realFetch(url, init);
    const txt = await resp.text();

    return new Response(txt);
  } else if (urlStr.includes("/api/channel/hls/")) {
    console.log(await usherInfo.handleRequest(urlStr));
  }
  return realFetch(url, init);
}
self.fetch = hookFetch;
