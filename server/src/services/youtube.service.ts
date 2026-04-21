import { env } from '../config/env';
import { YouTubeItem } from '../types';

export async function searchYouTube(query: string): Promise<YouTubeItem[]> {
  const key = env.YOUTUBE_API_KEY;

  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&key=${key}`
  );
  const searchData = await searchRes.json() as any;

  if (!searchData.items?.length) return [];

  const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
  const statsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${key}`
  );
  const statsData = await statsRes.json() as any;

  return searchData.items.map((item: any) => {
    const videoId = item.id.videoId;
    const details = statsData.items?.find((v: any) => v.id === videoId);
    return {
      videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? '',
      channelTitle: item.snippet.channelTitle,
      duration: details?.contentDetails?.duration ?? 'PT0S',
      viewCount: details?.statistics?.viewCount ?? '0',
    };
  });
}
