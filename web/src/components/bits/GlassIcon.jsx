import React from 'react';
import * as LucideIcons from 'lucide-react';
import './glassicon.css';

/**
 * Maps legacy glassicon name strings to Lucide icon components.
 * This ensures backward compatibility with all currently used icon names.
 */
const nameToLucide = {
  home: 'Home',
  sensors: 'Activity',
  controls: 'Sliders',
  ai: 'Bot',
  config: 'Settings2',
  sun: 'Sun',
  moon: 'Moon',
  menu: 'Menu',
  close: 'X',
  sprout: 'Sprout',
  monitoring: 'Activity',
  watering: 'Droplet',
  disease: 'ShieldAlert',
  weather: 'CloudSun',
  voice: 'Mic',
  insights: 'Lightbulb',
  mobile: 'Smartphone',
  alerts: 'BellRing',
  check: 'CheckCircle2',
  kit: 'Package',
  demo: 'Presentation',
  guide: 'BookOpen',
  bell: 'Bell',
  bellDot: 'BellDot',
  database: 'Database',
  chart: 'BarChart3',
  chartBar: 'BarChart',
  analytics: 'TrendingUp',
  records: 'ClipboardList',
  'arrow-right': 'ArrowRight',
  water: 'Droplets',
  settings: 'Settings',
  wifi: 'Wifi',
  wifiOff: 'WifiOff',
  'wifi-off': 'WifiOff',
  temperature: 'Thermometer',
  humidity: 'Droplets',
  light: 'Sun',
  ph: 'Beaker',
  pump: 'Zap',
  schedule: 'CalendarClock',
  esp32: 'Cpu',
  bot: 'Bot',
  chat: 'MessageSquare',
  image: 'Image',
  send: 'Send',
  refresh: 'RotateCw',
  download: 'Download',
  info: 'Info',
  warning: 'AlertTriangle',
  error: 'AlertCircle',
  success: 'CheckCircle',
  eye: 'Eye',
  filter: 'Filter',
  calendar: 'Calendar',
  leaf: 'Leaf',
  tag: 'Tag',
  activity: 'Activity',
  server: 'Server',
  trash: 'Trash2',
  clock: 'Clock',
  link: 'Link2',
};

export function GlassIcon({ name, className = '', animated = false, size = 'md' }) {
  const animClass = animated ? 'glass-icon-animated' : '';
  const sizeClass = `glass-icon-${size}`;
  
  // Resolve the Lucide icon component
  const lucideName = nameToLucide[name] || nameToLucide.home;
  const IconComponent = LucideIcons[lucideName] || LucideIcons.Home;

  return (
    <span
      className={`glass-icon ${animClass} ${sizeClass} ${className}`.trim()}
      aria-hidden="true"
    >
      <IconComponent 
        strokeWidth={1.8}
        // Size is handled via CSS in glassicon.css
      />
    </span>
  );
}
