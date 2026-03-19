import React from 'react';

const SproutSenseLogo = ({ className = '', width = '185px', height = '236px' }) => {
  return (
    <div className={`sproutsense-logo-wrapper ${className}`} style={{ width, height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg 
        version="1.0" 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100 300" 
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        <defs>
          {/* Gradient matching the SproutSense theme (Blue WiFi to Green Leaves) */}
          <linearGradient id="sproutGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />   {/* Dark Blue Base */}
            <stop offset="35%" stopColor="#22c55e" />  {/* Teal Transition */}
            <stop offset="65%" stopColor="#22d3ee" />  {/* Vibrant Green Leaves */}
            <stop offset="100%" stopColor="#22d3ee" /> {/* Blue WiFi Top */}
          </linearGradient>
        </defs>
        
        <style>
          {`
            .animated-logo-g {
              animation: float 4s ease-in-out infinite;
              transform-origin: center;
            }
            
            .pulse-path {
              animation: pulse 2.5s ease-in-out infinite alternate;
            }
            
            /* Staggering the pulse animation slightly for different paths */
            .pulse-path:nth-child(even) {
              animation-delay: 0.5s;
            }

            @keyframes float {
              0% { transform: translate(0, 236px) scale(0.1, -0.1) translateY(0); }
              50% { transform: translate(0, 236px) scale(0.1, -0.1) translateY(-60px); }
              100% { transform: translate(0, 236px) scale(0.1, -0.1) translateY(0); }
            }

            @keyframes pulse {
              0% { opacity: 0.85; filter: brightness(1); }
              100% { opacity: 1; filter: brightness(1.25); drop-shadow(0px 0px 4px rgba(84, 180, 53, 0.4)); }
            }
          `}
        </style>

        {/* Note the transform scales by 0.1, -0.1 to fix the inverted coordinate system from the original export */}
        <g className="animated-logo-g" fill="url(#sproutGradient)" stroke="none">
          <path className="pulse-path" d="M740 2140 c-132 -32 -236 -88 -331 -177 -53 -49 -61 -79 -31 -106 29 -27 50 -20 110 34 65 57 210 132 290 148 198 41 430 -19 574 -148 60 -55 85 -62 111 -33 28 31 20 57 -32 105 -179 167 -449 237 -691 177z"/>
          <path className="pulse-path" d="M815 1940 c-96 -20 -188 -69 -263 -139 -41 -38 -41 -78 -1 -100 30 -17 27 -18 124 59 29 24 76 49 114 60 129 41 281 17 376 -60 97 -77 94 -76 124 -59 60 34 29 93 -90 169 -97 63 -272 95 -384 70z"/>
          <path className="pulse-path" d="M244 1762 c-23 -15 -77 -139 -100 -230 -30 -117 -36 -648 -9 -774 60 -287 292 -530 584 -613 21 -6 23 -5 16 11 -4 11 -13 39 -20 64 -11 40 -17 46 -61 64 -140 56 -284 190 -353 329 -69 140 -75 181 -76 517 0 330 6 372 71 503 19 37 34 76 34 86 0 36 -55 64 -86 43z"/>
          <path className="pulse-path" d="M835 1729 c-104 -30 -181 -109 -151 -155 23 -34 60 -31 109 11 71 61 176 62 253 1 56 -43 87 -46 110 -11 57 87 -174 198 -321 154z"/>
          <path className="pulse-path" d="M1576 1643 c-37 -43 -101 -76 -245 -124 -223 -75 -323 -178 -338 -349 l-6 -60 79 78 c67 65 99 87 212 146 73 37 136 66 138 63 5 -4 -62 -55 -197 -150 -238 -166 -349 -408 -349 -761 l0 -99 -39 -36 c-120 -113 18 -298 161 -214 78 46 85 172 10 218 l-33 20 4 190 c4 212 22 292 89 405 l33 55 100 6 c295 19 454 224 430 552 -8 102 -11 105 -49 60z"/>
          <path className="pulse-path" d="M883 1520 c-47 -20 -57 -87 -18 -125 69 -70 180 29 118 104 -21 24 -68 35 -100 21z"/>
          <path className="pulse-path" d="M1701 1470 c-2 -66 -26 -171 -54 -232 -23 -49 -25 -68 -30 -238 -4 -156 -9 -198 -29 -265 -60 -202 -213 -374 -401 -450 -45 -19 -51 -25 -62 -65 -7 -25 -16 -53 -20 -63 -7 -16 -4 -17 21 -11 197 47 419 231 512 425 76 157 81 191 82 564 1 194 -2 332 -8 350 -10 29 -10 29 -11 -15z"/>
          <path className="pulse-path" d="M320 1379 c0 -46 28 -146 57 -203 72 -142 190 -222 356 -242 67 -7 79 -20 104 -104 l16 -55 18 65 18 65 -31 50 c-66 109 -138 178 -259 246 -50 28 -52 30 -19 24 92 -17 212 -93 269 -169 45 -59 53 -58 45 7 -25 195 -119 274 -362 302 -72 8 -148 22 -168 30 -47 19 -44 20 -44 -16z"/>
          <path className="pulse-path" d="M718 760 c-101 -41 -209 -129 -255 -208 l-26 -43 38 -39 39 -40 27 48 c48 85 143 159 252 195 18 7 21 25 11 76 -8 36 -19 38 -86 11z"/>
          <path className="pulse-path" d="M1036 736 c-8 -48 -3 -66 17 -66 59 -1 199 -110 246 -192 l27 -48 39 40 38 39 -26 44 c-53 91 -208 204 -304 223 -30 6 -31 5 -37 -40z"/>
          <path className="pulse-path" d="M757 549 c-50 -26 -111 -88 -137 -138 l-20 -40 27 -14 c63 -32 71 -31 92 11 11 22 38 54 61 72 37 29 40 35 40 81 0 56 -6 58 -63 28z"/>
          <path className="pulse-path" d="M1020 525 c0 -41 5 -49 54 -98 30 -30 57 -64 61 -76 8 -26 16 -26 65 -1 l40 20 -19 39 c-31 59 -69 99 -125 131 -69 40 -76 39 -76 -15z"/>
        </g>
      </svg>
    </div>
  );
};

export default SproutSenseLogo;
