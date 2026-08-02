import React, { useRef, useState } from "react";
import { HiPlay, HiPause, HiEye, HiShieldCheck, HiSparkles } from "react-icons/hi2";

// Replace with real video or thumbnail
import videoThumbnail from "../../../assets/Images/Aboutus/thumbnail_video.png";
// Add a placeholder video (MP4), replace with real video as needed
import sampleVideo from "../../../assets/Images/Aboutus/aboutus_video.mp4"; // You must provide this file or change the path

const features = [
  {
    icon: <HiEye className="text-white w-7 h-7" />,
    title: "Our Vision",
    desc: "To be the leading online destination for fresh, quality groceries delivered quickly and affordably to every home.",
  },
  {
    icon: <HiShieldCheck className="text-white w-7 h-7" />,
    title: "Our Mission",
    desc: "To empower every household with easy access to eco-friendly, farm-fresh produce and trusted brands, while supporting sustainable practices and local communities.",
  },
  {
    icon: <HiSparkles className="text-white w-7 h-7" />,
    title: "Our Values",
    desc: "Quality, transparency, customer satisfaction, and a commitment to the environment—these are at the heart of everything we do at Amma Grocery.",
  },
];

const AboutVideoSection = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const handlePlay = () => {
    setShowVideo(true);
    // Delay video play until video element in DOM
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }, 50);
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Show play button if video ended
  const handleEnded = () => {
    setIsPlaying(false);
  };

  // Restore thumbnail if user closes the video (optional, can add close btn)
  const handleCloseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    setShowVideo(false);
    setShowControls(false);
  };

  // Only show play/pause controls on hover when video is playing
  const videoContainerEvents = showVideo
    ? {
        onMouseEnter: () => setShowControls(true),
        onMouseLeave: () => setShowControls(false),
        onFocus: () => setShowControls(true), // for accessibility
        onBlur: () => setShowControls(false),
      }
    : {};

  return (
    <section className="w-full bg-white py-20 md:py-2 select-none">
      
      {/* VIDEO SECTION */}
      <div
        className="relative w-full h-[380px] md:h-[520px] overflow-hidden max-w-[1440px] mx-auto"
        {...videoContainerEvents}
      >
        {!showVideo ? (
          <>
            {/* Thumbnail */}
            <img 
              src={videoThumbnail} 
              alt="Video Preview" 
              className="w-full h-full object-cover"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40"></div>
            {/* Play Button */}
            <button
              aria-label="Play Video"
              className="absolute inset-0 m-auto w-[110px] h-[110px] md:w-[140px] md:h-[140px] bg-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition"
              onClick={handlePlay}
              tabIndex={0}
              type="button"
            >
              <HiPlay className="text-green-600 w-12 h-12" />
            </button>
          </>
        ) : (
          <>
            {/* Video Player */}
            <video
              ref={videoRef}
              src={sampleVideo}
              poster={videoThumbnail}
              controls={false}
              className="w-full h-full object-cover"
              onEnded={handleEnded}
              onClick={handleVideoClick}
              tabIndex={0}
              autoFocus
            />
            {/* Pause/Play button overlay in video */}
            {/* If video is playing, hide the button unless hovered; if paused, always show the button */}
            {(showControls || !isPlaying) && (
              <button
                aria-label={isPlaying ? "Pause Video" : "Play Video"}
                className="absolute m-auto left-0 right-0 top-0 bottom-0 w-[80px] h-[80px] md:w-[110px] md:h-[110px] bg-white/70 hover:bg-white rounded-full flex items-center justify-center shadow-xl transition z-30"
                style={{
                  opacity: isPlaying
                    ? showControls
                      ? 0.75
                      : 0
                    : 1,
                  pointerEvents: "auto",
                  visibility: isPlaying && !showControls ? "hidden" : "visible",
                  transition: "opacity 0.3s, visibility 0.2s",
                }}
                onClick={handleVideoClick}
                type="button"
                tabIndex={0}
              >
                {isPlaying ? (
                  <HiPause className="text-green-600 w-12 h-12" />
                ) : (
                  <HiPlay className="text-green-600 w-12 h-12" />
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* FEATURES CARDS */}
      <div className="container mx-auto px-6 mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((item, index) => (
          <div
            key={index}
            className="bg-background-secondary rounded-2xl p-8 md:p-10 hover:shadow-md transition duration-300"
          >
            {/* ICON */}
            <div className="w-12 h-12 rounded-[12px] bg-green-500 flex items-center justify-center mb-6">
              {item.icon}
            </div>

            {/* TITLE */}
            <h3 className="text-h6 md:text-h5 font-medium text-black mb-3">
              {item.title}
            </h3>

            {/* TEXT */}
            <p className="text-body-lg text-text-300 leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AboutVideoSection;
