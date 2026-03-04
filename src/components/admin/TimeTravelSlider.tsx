'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Clock, Calendar } from 'lucide-react';

interface TimeTravelSliderProps {
  onTimeChange?: (date: Date) => void;
}

const TimeTravelSlider: React.FC<TimeTravelSliderProps> = ({ onTimeChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedRange, setSelectedRange] = useState('30d'); // 30d, 7d, 24h

  const minTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const maxTime = new Date();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = new Date(prev.getTime() + speed * 60 * 1000); // Advance by speed minutes
          if (newTime > maxTime) {
            setIsPlaying(false);
            return maxTime;
          }
          return newTime;
        });
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, speed]);

  useEffect(() => {
    onTimeChange?.(currentTime);
  }, [currentTime, onTimeChange]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timestamp = parseInt(e.target.value);
    setCurrentTime(new Date(timestamp));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const jumpToNow = () => {
    setCurrentTime(maxTime);
    setIsPlaying(false);
  };

  const jumpToStart = () => {
    setCurrentTime(minTime);
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const changeSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  const timeRange = maxTime.getTime() - minTime.getTime();
  const currentPosition = ((currentTime.getTime() - minTime.getTime()) / timeRange) * 100;

  return (
    <motion.div
      className="bg-black/80 backdrop-blur-xl rounded-xl p-6 border border-green-500/30"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-green-400" />
        <h3 className="text-xl font-bold text-white">Time Travel Debugger</h3>
        <div className="ml-auto flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>Historical Data Analysis</span>
        </div>
      </div>

      {/* Current Time Display */}
      <div className="text-center mb-6">
        <div className="text-3xl font-mono text-green-400 mb-1">
          {formatTime(currentTime)}
        </div>
        <div className="text-sm text-gray-400">
          {currentTime > new Date(Date.now() - 24 * 60 * 60 * 1000)
            ? 'Recent Activity'
            : 'Historical Data'
          }
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Position: {currentPosition.toFixed(1)}%
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-center gap-2 mb-4">
        {[
          { label: '24h', value: '24h' },
          { label: '7d', value: '7d' },
          { label: '30d', value: '30d' }
        ].map((range) => (
          <button
            key={range.value}
            onClick={() => setSelectedRange(range.value)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              selectedRange === range.value
                ? 'bg-green-500 text-black'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Time Slider */}
      <div className="relative mb-6">
        <input
          type="range"
          min={minTime.getTime()}
          max={maxTime.getTime()}
          value={currentTime.getTime()}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-green"
        />

        {/* Time markers */}
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatTime(minTime)}</span>
          <span>{formatTime(maxTime)}</span>
        </div>

        {/* Current position indicator */}
        <motion.div
          className="absolute top-0 left-0 h-2 bg-green-400 rounded-l-lg pointer-events-none"
          style={{ width: `${currentPosition}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <motion.button
          onClick={jumpToStart}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <SkipBack className="w-4 h-4" />
        </motion.button>

        <motion.button
          onClick={togglePlayPause}
          className={`p-3 rounded-full text-white transition-colors ${
            isPlaying
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </motion.button>

        <motion.button
          onClick={jumpToNow}
          className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <SkipForward className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Speed Controls */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-sm text-gray-400">Speed:</span>
        {[0.5, 1, 2, 5, 10].map((spd) => (
          <button
            key={spd}
            onClick={() => changeSpeed(spd)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              speed === spd
                ? 'bg-green-500 text-black'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {spd}x
          </button>
        ))}
      </div>

      {/* Status and Warnings */}
      <div className="space-y-2">
        <div className={`text-sm p-3 rounded-lg ${
          isPlaying
            ? 'bg-green-500/10 border border-green-500/30 text-green-300'
            : 'bg-gray-700/50 text-gray-400'
        }`}>
          Status: {isPlaying ? 'Playing' : 'Paused'} |
          Speed: {speed}x |
          Mode: {currentTime > new Date(Date.now() - 24 * 60 * 60 * 1000) ? 'Live' : 'Historical'}
        </div>

        <div className="text-yellow-400 text-sm text-center bg-yellow-400/10 p-2 rounded">
          ⚠️ Time travel shows historical data. Some actions may not be available.
        </div>
      </div>

      {/* Data Points Indicator */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="p-2 bg-gray-800 rounded">
          <div className="text-lg font-bold text-blue-400">1.2K</div>
          <div className="text-xs text-gray-400">Events</div>
        </div>
        <div className="p-2 bg-gray-800 rounded">
          <div className="text-lg font-bold text-green-400">89%</div>
          <div className="text-xs text-gray-400">Data Quality</div>
        </div>
        <div className="p-2 bg-gray-800 rounded">
          <div className="text-lg font-bold text-purple-400">24h</div>
          <div className="text-xs text-gray-400">Retention</div>
        </div>
      </div>
    </motion.div>
  );
};

export default TimeTravelSlider;