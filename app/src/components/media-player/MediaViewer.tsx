'use client'

import { useState } from 'react'
import { X, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'

interface MediaViewerProps {
  src: string
  type: 'image' | 'video' | 'audio'
  filename: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function MediaViewer({ src, type, filename, open, onOpenChange }: MediaViewerProps) {
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)

  const handlePlayPause = () => {
    if (type === 'video' && videoRef) {
      if (playing) {
        videoRef.pause()
      } else {
        videoRef.play()
      }
      setPlaying(!playing)
    } else if (type === 'audio' && audioRef) {
      if (playing) {
        audioRef.pause()
      } else {
        audioRef.play()
      }
      setPlaying(!playing)
    }
  }

  const handleMute = () => {
    if (type === 'video' && videoRef) {
      videoRef.muted = !muted
      setMuted(!muted)
    } else if (type === 'audio' && audioRef) {
      audioRef.muted = !muted
      setMuted(!muted)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-0">
        <div className="relative bg-black">
          {type === 'image' && (
            <div className="relative">
              <img
                src={src}
                alt={filename}
                className="max-h-[80vh] w-auto mx-auto"
              />
            </div>
          )}

          {type === 'video' && (
            <div className="relative">
              <video
                ref={(el) => {
                  if (el) {
                    setVideoRef(el)
                    el.addEventListener('play', () => setPlaying(true))
                    el.addEventListener('pause', () => setPlaying(false))
                  }
                }}
                src={src}
                className="max-h-[80vh] w-full"
                controls={false}
                autoPlay
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePlayPause}
                    className="text-white hover:bg-white/20"
                  >
                    {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                  <span className="text-white text-sm ml-auto">{filename}</span>
                </div>
              </div>
            </div>
          )}

          {type === 'audio' && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Volume2 className="h-16 w-16 text-primary" />
                </div>
                <p className="text-white text-lg font-medium">{filename}</p>
              </div>
              <audio
                ref={(el) => {
                  if (el) {
                    setAudioRef(el)
                    el.addEventListener('play', () => setPlaying(true))
                    el.addEventListener('pause', () => setPlaying(false))
                  }
                }}
                src={src}
                controls
                className="w-full"
              />
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMute}
                  className="text-white hover:bg-white/20"
                >
                  {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

