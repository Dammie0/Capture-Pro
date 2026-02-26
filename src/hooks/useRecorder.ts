import { useState, useRef, useCallback } from "react";

export type AudioSource = "none" | "mic" | "system" | "both";
export type VideoQuality = "720p" | "1080p";

export interface RecorderSettings {
  quality: VideoQuality;
  audio: AudioSource;
  webcam: boolean;
}

export function useRecorder() {
  const [status, setStatus] = useState<
    "idle" | "countdown" | "recording" | "paused" | "preview"
  >("idle");
  const [countdown, setCountdown] = useState(3);
  const [timer, setTimer] = useState(0);
  const [fileSize, setFileSize] = useState(0);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  const cleanupStreams = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setWebcamStream((prev) => {
      if (prev) prev.getTracks().forEach((t) => t.stop());
      return null;
    });
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(console.error);
      }
      audioContextRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, []);

  const startRecording = async (settings: RecorderSettings) => {
    try {
      const videoConstraints =
        settings.quality === "1080p"
          ? { width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } };

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: videoConstraints,
        audio: settings.audio === "system" || settings.audio === "both",
      });

      let micStream: MediaStream | null = null;
      let localWebcamStream: MediaStream | null = null;

      if (
        settings.audio === "mic" ||
        settings.audio === "both" ||
        settings.webcam
      ) {
        try {
          const userMedia = await navigator.mediaDevices.getUserMedia({
            audio: settings.audio === "mic" || settings.audio === "both",
            video: settings.webcam
              ? { width: { ideal: 320 }, height: { ideal: 240 } }
              : false,
          });

          if (settings.webcam) {
            localWebcamStream = new MediaStream(userMedia.getVideoTracks());
            setWebcamStream(localWebcamStream);
          }
          if (settings.audio === "mic" || settings.audio === "both") {
            micStream = new MediaStream(userMedia.getAudioTracks());
          }
        } catch (err) {
          console.warn("Could not get user media (mic/webcam)", err);
        }
      }

      const audioTracks: MediaStreamTrack[] = [];
      if (settings.audio !== "none") {
        const audioCtx = new AudioContext();
        audioContextRef.current = audioCtx;
        const dest = audioCtx.createMediaStreamDestination();

        if (screenStream.getAudioTracks().length > 0) {
          const source = audioCtx.createMediaStreamSource(
            new MediaStream([screenStream.getAudioTracks()[0]]),
          );
          source.connect(dest);
        }
        if (micStream && micStream.getAudioTracks().length > 0) {
          const source = audioCtx.createMediaStreamSource(
            new MediaStream([micStream.getAudioTracks()[0]]),
          );
          source.connect(dest);
        }
        audioTracks.push(...dest.stream.getAudioTracks());
      }

      const finalStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...audioTracks,
      ]);
      streamRef.current = finalStream;

      screenStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

      setStatus("countdown");
      setCountdown(3);

      for (let i = 3; i > 0; i--) {
        setCountdown(i);
        await new Promise((r) => setTimeout(r, 1000));
      }

      chunksRef.current = [];
      setFileSize(0);
      setTimer(0);

      let mimeType = "video/webm; codecs=vp9";
      if (MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4";
      } else if (MediaRecorder.isTypeSupported("video/webm; codecs=vp8")) {
        mimeType = "video/webm; codecs=vp8";
      } else if (MediaRecorder.isTypeSupported("video/webm")) {
        mimeType = "video/webm";
      }

      const recorder = new MediaRecorder(finalStream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          setFileSize((prev) => prev + e.data.size);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setMediaUrl(url);
        setStatus("preview");
        cleanupStreams();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setStatus("recording");

      timerIntervalRef.current = window.setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording", err);
      setStatus("idle");
      cleanupStreams();
    }
  };

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setStatus("paused");
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setStatus("recording");
      timerIntervalRef.current = window.setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
  }, []);

  const reset = useCallback(() => {
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    setMediaUrl(null);
    setStatus("idle");
    setTimer(0);
    setFileSize(0);
    setCountdown(3);
    cleanupStreams();
  }, [mediaUrl, cleanupStreams]);

  return {
    status,
    countdown,
    timer,
    fileSize,
    mediaUrl,
    webcamStream,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    reset,
  };
}
