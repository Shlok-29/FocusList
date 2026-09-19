import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Flame,
  CloudRain,
  Radio,
  Wind,
  Flame as FireIcon,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { soundFx } from "../lib/soundEffects";
import { triggerConfetti } from "../lib/confetti";

export type TaskItem = {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
};

interface FocusTimerProps {
  tasks: TaskItem[];
  onCompleteTask?: (taskId: string) => void;
  onLogFocusMinutes?: (minutes: number) => void;
}

type Mode = "pomodoro" | "deepwork" | "shortBreak" | "longBreak";

const MODE_PRESETS: Record<Mode, { label: string; seconds: number }> = {
  pomodoro: { label: "Focus (25m)", seconds: 25 * 60 },
  deepwork: { label: "Deep Work (50m)", seconds: 50 * 60 },
  shortBreak: { label: "Short Break (5m)", seconds: 5 * 60 },
  longBreak: { label: "Long Break (15m)", seconds: 15 * 60 },
};

export default function FocusTimer({ tasks, onCompleteTask, onLogFocusMinutes }: FocusTimerProps) {
  const [mode, setMode] = useState<Mode>("pomodoro");
  const [timeLeft, setTimeLeft] = useState(MODE_PRESETS.pomodoro.seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ambientSound, setAmbientSound] = useState<"none" | "rain" | "binaural" | "whitenoise" | "fireplace">("none");
  const [ambientVolume, setAmbientVolume] = useState(0.4);
  const [audioMuted, setAudioMuted] = useState(false);

  const currentPreset = MODE_PRESETS[mode];
  const progressPercent = Math.min(100, Math.max(0, ((currentPreset.seconds - timeLeft) / currentPreset.seconds) * 100));

  useEffect(() => {
    setTimeLeft(MODE_PRESETS[mode].seconds);
    setIsRunning(false);
  }, [mode]);

  useEffect(() => {
    let interval: number | undefined;
    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      soundFx.playAlarmSound();
      triggerConfetti();

      const elapsedMinutes = Math.round(currentPreset.seconds / 60);
      if (onLogFocusMinutes) {
        onLogFocusMinutes(elapsedMinutes);
      }

      if (selectedTaskId && onCompleteTask) {
        onCompleteTask(selectedTaskId);
      }
    }

    return () => window.clearInterval(interval);
  }, [isRunning, timeLeft, currentPreset.seconds, selectedTaskId, onCompleteTask, onLogFocusMinutes]);

  const toggleRun = () => {
    soundFx.playClick();
    setIsRunning((prev) => !prev);
    if (!isRunning && ambientSound !== "none") {
      soundFx.startAmbient(ambientSound, ambientVolume);
    }
  };

  const resetTimer = () => {
    soundFx.playClick();
    setIsRunning(false);
    setTimeLeft(currentPreset.seconds);
    soundFx.stopAmbient();
    setAmbientSound("none");
  };

  const handleAmbientChange = (type: "none" | "rain" | "binaural" | "whitenoise" | "fireplace") => {
    soundFx.playClick();
    setAmbientSound(type);
    if (type === "none") {
      soundFx.stopAmbient();
    } else {
      soundFx.startAmbient(type, ambientVolume);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setAmbientVolume(vol);
    soundFx.setAmbientVolume(vol);
  };

  const toggleMute = () => {
    const nextMute = !audioMuted;
    setAudioMuted(nextMute);
    soundFx.setMuted(nextMute);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  const activeTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div className={`focus-timer-card ${isFullscreen ? "fullscreen-focus" : ""}`}>
      {isFullscreen && (
        <div className="fullscreen-overlay-bg">
          <div className="pulse-aura" />
        </div>
      )}

      <div className="focus-header">
        <div className="focus-title">
          <Sparkles className="icon-sparkle" size={18} />
          <span>Focus Session</span>
        </div>
        <div className="focus-header-actions">
          <button
            className="icon-btn-minimal"
            onClick={toggleMute}
            title={audioMuted ? "Unmute audio" : "Mute audio"}
          >
            {audioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            className="icon-btn-minimal"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Focus"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="mode-selector">
        {(Object.keys(MODE_PRESETS) as Mode[]).map((m) => (
          <button
            key={m}
            className={`mode-btn ${mode === m ? "active" : ""}`}
            onClick={() => {
              soundFx.playClick();
              setMode(m);
            }}
          >
            {MODE_PRESETS[m].label}
          </button>
        ))}
      </div>

      {/* SVG Ring Timer */}
      <div className="timer-ring-wrap">
        <svg className="timer-svg" viewBox="0 0 160 160">
          <circle className="timer-circle-bg" cx="80" cy="80" r="70" />
          <circle
            className="timer-circle-progress"
            cx="80"
            cy="80"
            r="70"
            style={{
              strokeDasharray: 440,
              strokeDashoffset: 440 - (440 * progressPercent) / 100,
            }}
          />
        </svg>
        <div className="timer-display">
          <span className="time-digits">{formatTime(timeLeft)}</span>
          <span className="mode-caption">{currentPreset.label}</span>
        </div>
      </div>

      {/* Active Task Selector */}
      <div className="task-attach-bar">
        <span className="attach-label">Target Task:</span>
        <div className="select-dropdown-wrap">
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="task-select-input"
          >
            <option value="">No task linked</option>
            {tasks
              .filter((t) => !t.completed)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
          </select>
          <ChevronDown size={14} className="select-chevron" />
        </div>
      </div>

      {activeTask && (
        <div className="active-task-badge">
          <Flame size={14} className="text-orange-500" />
          <span>Focusing on: <strong>{activeTask.title}</strong></span>
        </div>
      )}

      {/* Controls */}
      <div className="focus-controls">
        <button className="primary-timer-btn" onClick={toggleRun}>
          {isRunning ? (
            <>
              <Pause size={18} /> <span>Pause</span>
            </>
          ) : (
            <>
              <Play size={18} /> <span>Start Focus</span>
            </>
          )}
        </button>
        <button className="secondary-timer-btn" onClick={resetTimer} title="Reset Timer">
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Ambient Sound Generators */}
      <div className="ambient-mixer">
        <span className="mixer-title">Ambient Soundscape</span>
        <div className="ambient-buttons">
          <button
            className={`ambient-chip ${ambientSound === "rain" ? "active" : ""}`}
            onClick={() => handleAmbientChange("rain")}
          >
            <CloudRain size={13} /> <span>Rain</span>
          </button>
          <button
            className={`ambient-chip ${ambientSound === "binaural" ? "active" : ""}`}
            onClick={() => handleAmbientChange("binaural")}
          >
            <Radio size={13} /> <span>Binaural (10Hz)</span>
          </button>
          <button
            className={`ambient-chip ${ambientSound === "whitenoise" ? "active" : ""}`}
            onClick={() => handleAmbientChange("whitenoise")}
          >
            <Wind size={13} /> <span>White Noise</span>
          </button>
          <button
            className={`ambient-chip ${ambientSound === "fireplace" ? "active" : ""}`}
            onClick={() => handleAmbientChange("fireplace")}
          >
            <FireIcon size={13} /> <span>Fireplace</span>
          </button>
        </div>

        {ambientSound !== "none" && (
          <div className="volume-slider-wrap">
            <Volume2 size={13} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={ambientVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="volume-slider"
            />
          </div>
        )}
      </div>
    </div>
  );
}
