import { WATCH_VIDEOS, getWatchPath, getVideoEmbed, getVideoThumbnail } from "../data/watchVideos.js";

export const escapeVideoHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

export const VIDEO_LIBRARY_TITLE = "Ilika Videos: Product Demos and Brand Stories";
export const VIDEO_LIBRARY_DESCRIPTION = "Watch Ilika product demonstrations, beauty device videos and the story behind the brand. Choose a video to watch on its dedicated page.";

export const renderWatchContent = (video) => {
  const escape = escapeVideoHtml;
  const player = video.youtubeId
    ? `<iframe src="${escape(getVideoEmbed(video))}" title="${escape(video.title)}" class="block aspect-video w-full border-0" allow="encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>`
    : `<video src="${escape(video.contentUrl)}" poster="${escape(getVideoThumbnail(video))}" controls playsinline preload="metadata" aria-label="${escape(video.title)}" class="block aspect-video w-full object-contain"></video>`;
  return `<main data-prerendered="video" class="mx-auto w-full max-w-5xl px-4 py-5 sm:py-8">
    <nav aria-label="Breadcrumb" class="mb-3 text-sm text-gray-600"><a href="/">Home</a> / <a href="/videos">Videos</a></nav>
    <h1 class="mb-4 text-2xl font-semibold text-gray-900 sm:text-3xl">${escape(video.title)}</h1>
    <div class="overflow-hidden rounded-xl bg-black">${player}</div>
    <p class="mt-5 text-base leading-relaxed text-gray-700">${escape(video.description)}</p>
    <p class="mt-3 text-sm text-gray-600">Published <time datetime="${escape(video.uploadDate)}">${escape(new Date(video.uploadDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }))}</time></p>
    <nav aria-label="Related links" class="mt-6 flex flex-wrap gap-5 text-pink-700 underline"><a href="${escape(video.relatedPath)}">${escape(video.relatedLabel)}</a><a href="/videos">All Ilika videos</a></nav>
  </main>`;
};

export const renderVideoLibrary = () => `<main data-prerendered="page" class="mx-auto w-full max-w-6xl px-4 py-8">
  <h1 class="text-3xl font-semibold text-gray-900">Ilika Videos</h1>
  <p class="mt-3 max-w-3xl leading-relaxed text-gray-600">${VIDEO_LIBRARY_DESCRIPTION}</p>
  <div class="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">${WATCH_VIDEOS.map((video) => `<article class="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <a href="${getWatchPath(video)}"><img src="${escapeVideoHtml(getVideoThumbnail(video))}" alt="${escapeVideoHtml(video.title)}" width="480" height="360" loading="lazy" class="aspect-video w-full object-cover" /><h2 class="px-4 pt-4 text-lg font-semibold text-gray-900">${escapeVideoHtml(video.title)}</h2></a>
    <p class="p-4 text-sm leading-relaxed text-gray-600">${escapeVideoHtml(video.description)}</p>
    <a href="${getWatchPath(video)}" class="mx-4 mb-4 inline-block font-semibold text-pink-700">Watch video →</a>
  </article>`).join("")}</div>
</main>`;
