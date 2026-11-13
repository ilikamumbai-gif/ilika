import { useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import StructuredData from "../components/StructuredData";
import { useSeo } from "../hooks/useSeo";
import { getWatchVideo, getWatchPath, getVideoSchema, getVideoThumbnail } from "../data/watchVideos";
import { renderWatchContent, renderVideoLibrary, VIDEO_LIBRARY_TITLE, VIDEO_LIBRARY_DESCRIPTION } from "../utils/videoPages";
import NotFound from "./NotFound";

export default function WatchVideo() {
  const { videoSlug } = useParams();
  const video = getWatchVideo(videoSlug);
  const isLibrary = !videoSlug;
  useSeo({
    title: video ? `${video.title} | Ilika` : isLibrary ? `${VIDEO_LIBRARY_TITLE} | Ilika` : "Video not found | Ilika",
    description: video?.description || VIDEO_LIBRARY_DESCRIPTION,
    path: video ? getWatchPath(video) : isLibrary ? "/videos" : `/watch/${videoSlug}`,
    image: video ? getVideoThumbnail(video) : undefined,
    type: video ? "video.other" : "website",
    robots: video || isLibrary ? "index, follow" : "noindex, follow",
  });
  if (!video && !isLibrary) return <NotFound />;
  return <>
    <Header />
    {video && <StructuredData schema={getVideoSchema(video)} />}
    <div dangerouslySetInnerHTML={{ __html: video ? renderWatchContent(video) : renderVideoLibrary() }} />
    <Footer />
  </>;
}
