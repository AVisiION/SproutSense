import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './glassicon.css';

import {
  faHouse,           // home
  faSlidersH,        // controls
  faRobot,           // ai, bot
  faGear,            // config
  faSun,             // sun, light
  faMoon,            // moon
  faBars,            // menu
  faXmark,           // close
  faSeedling,        // sprout
  faDroplet,         // watering, humidity
  faShield,          // disease
  faCloudSun,        // weather
  faMicrophone,      // voice
  faLightbulb,       // insights
  faMobileScreen,    // mobile
  faBell,            // bell, bellDot, alerts
  faDatabase,        // database
  faChartBar,        // chart, chartBar
  faArrowTrendUp,         // analytics — use faArrowTrendUp
  // faArrowTrendUp,    // analytics
  faClipboardList,   // records
  faArrowRight,      // arrow-right
  faWater,           // water
  faGears,           // settings
  faWifi,            // wifi
  faThermometerHalf, // temperature
  faFlask,           // ph
  faBolt,            // pump
  faCalendarDays,    // schedule
  faMicrochip,       // esp32
  faMessage,         // chat
  faImage,           // image
  faPaperPlane,      // send
  faRotateRight,     // refresh
  faDownload,        // download
  faCircleInfo,      // info
  faTriangleExclamation, // warning
  faCircleExclamation,   // error
  faCircleCheck,     // check, success
  faEye,             // eye
  faFilter,          // filter
  faCalendar,        // calendar
  faLeaf,            // leaf
  faTag,             // tag
  faBoltLightning,   // activity (closest available)
  faServer,          // server
  faTrash,           // trash
  faClock,           // clock
  faLink,            // link
  faBoxOpen,         // kit
  faChalkboardUser,  // demo
  faBook,            // guide
} from '@fortawesome/free-solid-svg-icons';

const nameToFA = {
  home: faHouse,
  sensors: faCircleInfo,
  controls: faSlidersH,
  ai: faRobot,
  config: faGear,
  sun: faSun,
  moon: faMoon,
  menu: faBars,
  close: faXmark,
  sprout: faSeedling,
  monitoring: faCircleInfo,
  watering: faDroplet,
  disease: faShield,
  weather: faCloudSun,
  voice: faMicrophone,
  insights: faLightbulb,
  mobile: faMobileScreen,
  alerts: faBell,
  check: faCircleCheck,
  kit: faBoxOpen,
  demo: faChalkboardUser,
  guide: faBook,
  bell: faBell,
  bellDot: faBell,
  database: faDatabase,
  chart: faChartBar,
  chartBar: faChartBar,
  analytics: faArrowTrendUp,
  records: faClipboardList,
  'arrow-right': faArrowRight,
  water: faWater,
  settings: faGears,
  wifi: faWifi,
  wifiOff: faWifi,
  'wifi-off': faWifi,
  temperature: faThermometerHalf,
  humidity: faDroplet,
  light: faSun,
  ph: faFlask,
  pump: faBolt,
  schedule: faCalendarDays,
  esp32: faMicrochip,
  bot: faRobot,
  chat: faMessage,
  image: faImage,
  send: faPaperPlane,
  refresh: faRotateRight,
  download: faDownload,
  info: faCircleInfo,
  warning: faTriangleExclamation,
  error: faCircleExclamation,
  success: faCircleCheck,
  eye: faEye,
  filter: faFilter,
  calendar: faCalendar,
  leaf: faLeaf,
  tag: faTag,
  activity: faArrowTrendUp,
  server: faServer,
  trash: faTrash,
  clock: faClock,
  link: faLink,
};

export function GlassIcon({ name, className = '', animated = false, size = 'md' }) {
  const animClass = animated ? 'glass-icon-animated' : '';
  const sizeClass = `glass-icon-${size}`;
  const icon = nameToFA[name] || nameToFA.home;

  return (
    <span
      className={`glass-icon ${animClass} ${sizeClass} ${className}`.trim()}
      aria-hidden="true"
    >
      <FontAwesomeIcon icon={icon} />
    </span>
  );
}
