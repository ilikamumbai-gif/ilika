// YouTube upload dates were checked against the public watch-page metadata.
// The self-hosted clip's date is its first tracked upload (git history).
export const WATCH_VIDEOS = [
  {
    slug: "leafless-hair-dryer-video",
    title: "Ilika BLDC Hair Dryer Video",
    description: "Watch the Ilika BLDC hair dryer video and explore the hair dryer shown in the clip.",
    contentUrl: "https://ilika.in/HonestReview/instagram-reel-youtube-short.mp4",
    thumbnailUrl: "https://ilika.in/HonestReview/instagram-reel-youtube-short-poster.jpg",
    uploadDate: "2026-07-16T11:32:14+05:30",
    relatedPath: "/product/leafless-hair-dryer",
    relatedLabel: "Explore the Ilika hair dryer",
  },
  {
    slug: "non-voice-mask-maker-demo",
    title: "Ilika Non-Voice Mask Maker Video",
    description: "Watch the Ilika non-voice mask maker demonstration showing how the machine makes a fresh face mask.",
    youtubeId: "MbgO5rpvGtU",
    uploadDate: "2026-03-23T05:00:40-07:00",
    relatedPath: "/product/non-voice-face-mask-maker",
    relatedLabel: "Explore the non-voice mask maker",
  },
  {
    slug: "acne-light-therapy-device-demo",
    title: "Ilika Acne Light Therapy Device Video",
    description: "Watch Ilika's introduction to the electronic acne light device, then view the product details.",
    youtubeId: "ay5DIc6d_-Q",
    uploadDate: "2026-11-11T21:38:56-08:00",
    relatedPath: "/product/acne-light-therapy-device",
    relatedLabel: "Explore the acne light therapy device",
  },
  {
    slug: "ilika-introduction",
    title: "Meet Ilika: Skincare, Haircare and Beauty Devices",
    description: "Watch the Ilika introduction video to discover the brand's skincare, haircare and beauty devices for everyday self-care.",
    youtubeId: "lEGWrDPXNpE",
    uploadDate: "2026-07-03T01:30:06-07:00",
    relatedPath: "/products",
    relatedLabel: "Explore Ilika products",
  },
  {
    slug: "high-frequency-therapy-wand-demo",
    title: "Ilika High Frequency Therapy Wand Video",
    description: "Watch the Ilika high frequency therapy wand video featuring the device and its four electrodes.",
    youtubeId: "Fuj-jsQ2lo0",
    uploadDate: "2026-05-29T00:27:56-07:00",
    relatedPath: "/product/high-frequency-therapy-wand",
    relatedLabel: "Explore the high frequency therapy wand",
  },
];

export const getWatchVideo = (slug) => WATCH_VIDEOS.find((video) => video.slug === slug);
export const getWatchPath = (video) => `/watch/${video.slug}`;
export const getVideoThumbnail = (video) => video.thumbnailUrl || `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
export const getVideoEmbed = (video) => `https://www.youtube.com/embed/${video.youtubeId}?playsinline=1&rel=0`;

export const getVideoSchema = (video) => ({
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "@id": `https://ilika.in${getWatchPath(video)}#video`,
  name: video.title,
  description: video.description,
  thumbnailUrl: [getVideoThumbnail(video)],
  uploadDate: video.uploadDate,
  url: `https://ilika.in${getWatchPath(video)}`,
  mainEntityOfPage: `https://ilika.in${getWatchPath(video)}`,
  ...(video.youtubeId ? { embedUrl: getVideoEmbed(video) } : { contentUrl: video.contentUrl }),
});
