import React, { useEffect, useRef } from "react";

export default function ChromaKeyVideo({ src, className = "" }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let animId;

    const processFrame = () => {
      if (video.paused || video.ended) {
        animId = requestAnimationFrame(processFrame);
        return;
      }

      // Cập nhật kích thước canvas theo đúng tỉ lệ video
      if (video.videoWidth && canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      if (canvas.width > 0 && canvas.height > 0) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const l = frame.data.length / 4;

        // Thuật toán lọc màu xanh lá (Chroma Key)
        for (let i = 0; i < l; i++) {
          const r = frame.data[i * 4 + 0];
          const g = frame.data[i * 4 + 1];
          const b = frame.data[i * 4 + 2];

          // Lọc dải màu xanh lá phông xanh
          if (g > 90 && r < 130 && b < 130 && g > r * 1.25 && g > b * 1.25) {
            frame.data[i * 4 + 3] = 0; // Đặt alpha trong suốt
          }
        }
        ctx.putImageData(frame, 0, 0);
      }

      animId = requestAnimationFrame(processFrame);
    };

    const handlePlay = () => {
      animId = requestAnimationFrame(processFrame);
    };

    video.addEventListener("play", handlePlay);

    // Tự động phát video
    video.play().catch((err) => {
      console.warn("Video autoplay đang chờ...", err);
    });

    return () => {
      video.removeEventListener("play", handlePlay);
      cancelAnimationFrame(animId);
    };
  }, [src]);

  return (
    <div className={`relative ${className}`}>
      {/* Video ẩn làm nguồn xử lý */}
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        crossOrigin="anonymous"
        className="hidden"
      />
      {/* Canvas hiển thị video đã tách phông xanh */}
      <canvas ref={canvasRef} className="w-full h-full object-contain" />
    </div>
  );
}