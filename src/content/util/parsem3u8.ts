// Define interface for segment information
export interface SegmentInfo {
  url: string;
  duration: number;
}

// Function to parse M3U8 file contents and create a JavaScript map
export function parseM3U8(contents: string): Map<number, SegmentInfo> {
  const segmentsMap: Map<number, SegmentInfo> = new Map();

  // Split the file contents into lines
  const lines: string[] = contents.trim().split("\n");

  let segmentIndex: number = 0;
  let segmentDuration: number | null = null;

  // Iterate through each line of the M3U8 file
  lines.forEach((line) => {
    if (line.startsWith("#EXTINF:")) {
      // Extract segment duration from #EXTINF tag
      segmentDuration = parseFloat(line.split(":")[1].split(",")[0]);
    } else if (!line.startsWith("#")) {
      // Assume it's a segment URL
      segmentsMap.set(segmentIndex, {
        url: line.trim(),
        duration: segmentDuration as number,
      });
      segmentIndex++;
    }
  });

  return segmentsMap;
}
