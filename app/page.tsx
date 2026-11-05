import AuthNav from "./components/AuthNav";
import HeroSlides from "./components/HeroSlides";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}

        html,body{
          width:100%;
          height:100%;
          background:#000;
          overflow:hidden;
          font-family:Tahoma,Verdana,Arial,sans-serif;
        }

        a{text-decoration:none;}

        .page{
          width:100vw;
          height:100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#000;
        }

        .homepage{
          position:relative;
          aspect-ratio:1535 / 1024;
          width:min(100vw, calc(100vh * 1.499));
          height:min(100vh, calc(100vw / 1.499));
          overflow:hidden;
          background:
            linear-gradient(to bottom,rgba(6,20,35,.08),rgba(5,18,32,.14)),
            url("/homepage.png");
          background-size:100% 100%;
          background-position:center;
          background-repeat:no-repeat;
          filter:brightness(1.13) contrast(1.05) saturate(1.08);
        }

        .dark-blue-blend{
          position:absolute;
          inset:0;
          z-index:20;
          pointer-events:none;
          background:
            linear-gradient(to bottom,rgba(0,12,25,.08),rgba(0,8,18,.12));
          mix-blend-mode:multiply;
        }

        .controller-overlay{
          position:absolute;
          left:3.15%;
          top:7.95%;
          width:9.9%;
          height:13.9%;
          z-index:35;
          pointer-events:none;
          display:flex;
          align-items:center;
          justify-content:center;
          filter:
            drop-shadow(2px 3px 3px rgba(0,0,0,.75))
            drop-shadow(0 0 5px rgba(255,255,255,.25))
            drop-shadow(0 0 8px rgba(0,130,220,.35));
        }

        .controller-spin-ring{
          position:absolute;
          left:8%;
          top:8%;
          width:84%;
          height:84%;
          border-radius:50%;
          border:3px solid rgba(90,170,230,.22);
          border-top-color:rgba(255,255,255,.78);
          border-right-color:rgba(95,190,255,.58);
          z-index:1;
          animation:controllerRingSpin 10s linear infinite;
          box-shadow:
            inset 0 0 10px rgba(0,0,0,.65),
            0 0 8px rgba(0,110,190,.22);
        }

        @keyframes controllerRingSpin{
          0%{transform:rotate(0deg);}
          100%{transform:rotate(360deg);}
        }

        .controller-overlay svg{
          position:relative;
          z-index:2;
          width:100%;
          height:100%;
          transform:rotate(-2deg);
        }

        .real-top-bar{
          position:absolute;
          left:0;
          top:0;
          width:100%;
          height:4.7%;
          z-index:80;
          background:linear-gradient(to bottom,#9a0000,#3a0000);
          border-bottom:1px solid #b10000;
          overflow:hidden;
        }

        .auth-holder{
          position:absolute;
          right:6.6%;
          top:0;
          height:100%;
          display:flex;
          align-items:center;
          justify-content:flex-end;
          white-space:nowrap;
        }

        .auth-holder *{
          line-height:1 !important;
        }

        .auth-holder .top-right-group{
          margin:0 !important;
          height:100%;
          display:flex !important;
          align-items:center !important;
          gap:7px !important;
          white-space:nowrap !important;
        }

        .auth-holder .top-btn{
          color:#fff !important;
          font-size:clamp(9px,.82vw,13px) !important;
          font-weight:900 !important;
          padding:0 3px !important;
          display:inline-flex !important;
          align-items:center !important;
          height:100% !important;
          white-space:nowrap !important;
          text-shadow:0 1px 2px #000 !important;
        }

        .auth-holder .top-sep{
          color:#bde9ff !important;
          font-size:clamp(9px,.82vw,13px) !important;
          display:inline-flex !important;
          align-items:center !important;
          height:100% !important;
          text-shadow:0 1px 2px #000 !important;
        }

        .top-help{
          position:absolute;
          right:.35%;
          top:0;
          height:100%;
          width:5.6%;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .top-help a{
          color:#fff;
          font-size:clamp(8px,.68vw,11px);
          font-weight:900;
          line-height:1;
          white-space:nowrap;
          text-shadow:0 1px 2px #000;
        }

        .hotspot{
          position:absolute;
          display:block;
          background:transparent;
          border:none;
          outline:none;
          cursor:pointer;
          z-index:90;
        }

        .hotspot:hover,
        .drop-wrap:hover{
          background:linear-gradient(to bottom,#1c4b72,#0b2e4c);
          box-shadow:inset 0 0 0 1px rgba(85,185,255,.45);
        }

        .nav-zone{
          top:24.25%;
          height:5.45%;
          background:linear-gradient(to bottom,#153957,#092039);
          border-right:1px solid rgba(74,145,205,.55);
        }

        .playstation{ left:.85%; width:10.5%; }
        .xbox{ left:11.35%; width:8.5%; }
        .nintendo{ left:19.85%; width:10%; }
        .pc{ left:29.85%; width:6.5%; }
        .mobile{ left:36.35%; width:8.5%; }
        .tournaments{ left:44.85%; width:10.5%; }
        .members{ left:55.35%; width:9.5%; }
        .forums{ left:64.85%; width:8.5%; }
        .staff-zone{
          left:73.35%;
          width:6.2%;
        }
        .nav-label{
          position:absolute;
          inset:0;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#fff;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          font-size:clamp(9px,.85vw,14px);
          font-weight:900;
          text-shadow:0 1px 3px #000;
          pointer-events:none;
        }

        .general{
          left:70.95%;
          top:15.25%;
          width:10.05%;
          height:4.35%;
        }

        .getting{
          left:82.25%;
          top:15.25%;
          width:11.95%;
          height:4.35%;
        }

        .search-box{
          position:absolute;
          left:80.3%;
          top:25.42%;
          width:16.8%;
          height:3.45%;
          z-index:95;
          display:flex;
          align-items:center;
          background:transparent;
        }

        .search-box input{
          width:100%;
          height:100%;
          background:transparent;
          border:none;
          outline:none;
          color:#fff;
          font-size:clamp(10px,1vw,15px);
          font-weight:700;
          padding-left:8%;
          padding-right:16%;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          text-shadow:0 1px 2px #000;
        }

        .search-box input::placeholder{color:transparent;}

        .search-button{
          position:absolute;
          right:0;
          top:0;
          width:15%;
          height:100%;
          border:none;
          background:transparent;
          cursor:pointer;
        }

        .search-box:hover,
        .search-box:focus-within{
          background:rgba(0,120,210,.13);
          box-shadow:inset 0 0 0 1px rgba(85,185,255,.45);
        }

        .drop-wrap{
          position:absolute;
          z-index:95;
          cursor:pointer;
        }

        .drop-wrap:hover .dropdown{display:block;}

        .drop-click{
          position:absolute;
          inset:0;
          z-index:1;
        }

        .dropdown{
          display:none;
          position:absolute;
          top:100%;
          left:0;
          width:235px;
          background:#07111b;
          border:1px solid #2f78af;
          box-shadow:0 6px 14px rgba(0,0,0,.6);
          z-index:120;
        }

        .dropdown a{
          display:flex;
          align-items:center;
          gap:8px;
          height:36px;
          padding:0 9px;
          color:#f3fbff;
          background:linear-gradient(to bottom,#0a1724,#050d15);
          border-bottom:1px solid #13293d;
          font-size:11px;
          font-weight:900;
          text-transform:uppercase;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          text-shadow:0 1px 2px #000;
        }

        .dropdown a:hover{
          background:linear-gradient(to bottom,#19486b,#0b2235);
          color:#fff;
        }

        .game-icon{
          width:24px;
          height:24px;
          border-radius:3px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:8px;
          font-weight:700;
          letter-spacing:.2px;
          color:#fff;
          flex-shrink:0;
          opacity:.92;
        }

        .cod-icon{ background:#7a6a3a; }
        .fortnite-icon{ background:#3a5f94; }
        .apex-icon{ background:#8a3a34; }
        .rainbow-icon{ background:#4d5560; }
        .rocket-icon{ background:#2f5f9a; }
        .battlefield-icon{ background:#4f6a3a; }
        .coc-icon{ background:#9a7030; }
        .cr-icon{ background:#37649c; }
        .uno-icon{ background:#9a3434; }

        .lower-layout{
          position:absolute;
          left:1.05%;
          top:31.15%;
          width:97.9%;
          height:63.35%;
          z-index:45;
          display:grid;
          grid-template-columns:22.5% 1fr;
          gap:0;
        }

        .left-panel{
          border:1px solid #006bad;
          background:linear-gradient(to bottom,#092846,#04111d);
          box-shadow:inset 0 0 0 1px rgba(0,42,75,.7);
          overflow:hidden;
          display:flex;
          flex-direction:column;
        }

        .panel-title{
          height:5.75%;
          background:linear-gradient(to bottom,#0b5188,#061a2b);
          border-bottom:1px solid #006bad;
          display:flex;
          align-items:center;
          padding-left:7%;
          color:#ffd95c;
          font-size:clamp(10px,1vw,16px);
          font-weight:900;
          text-transform:uppercase;
          text-shadow:0 1px 2px #000;
          flex-shrink:0;
        }

        .section-title{
          height:4.85%;
          background:linear-gradient(to bottom,#0b5188,#061a2b);
          border-top:1px solid #006bad;
          border-bottom:1px solid #006bad;
          display:flex;
          align-items:center;
          padding-left:7%;
          color:#ffd95c;
          font-size:clamp(9px,.82vw,13px);
          font-weight:900;
          text-transform:uppercase;
          text-shadow:0 1px 2px #000;
          flex-shrink:0;
        }

        .side-link{
          flex:1;
          min-height:0;
          border-bottom:1px solid #304a5b;
          color:#fff;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 7%;
          font-size:clamp(8px,.72vw,12px);
          font-weight:700;
          background:linear-gradient(to bottom,#0a1723,#041018);
          text-shadow:0 1px 2px #000;
        }

        .side-link:hover{
          background:#173a56;
          box-shadow:inset 0 0 0 1px rgba(85,185,255,.45);
        }

        .arrow{
          color:#e6f7ff;
          font-size:clamp(12px,1vw,18px);
          text-shadow:0 1px 2px #000;
        }

        .social{
          display:flex;
          align-items:center;
          gap:6px;
          min-width:0;
        }

        .social-icon{
          width:14px;
          height:14px;
          border-radius:3px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:8px;
          font-weight:bold;
          color:#fff;
          flex-shrink:0;
        }

        .discord-icon{background:#5865f2;}
        .x-icon{background:#000;border:1px solid #fff;}
        .youtube-icon{background:#ff0000;}
        .tiktok-icon{background:#111;color:#00f2ea;border:1px solid #ff0050;}
        .facebook-icon{background:#1877f2;}

        .hero-expanded{
          position:relative;
          border:1px solid #006bad;
          border-left:none;
          box-shadow:inset 0 0 0 1px rgba(0,42,75,.7);
          overflow:hidden;
          background:#050b12;
        }

        .hero-expanded .slide{
          position:absolute;
          inset:0;
          background-size:cover;
          background-position:center;
          background-repeat:no-repeat;
          opacity:0;
          transform:scale(1.03);
          animation:heroFade 77s infinite;
        }

        .hero-expanded .slide-one{
          background-image:
            linear-gradient(to bottom,rgba(20,36,52,.04),rgba(0,0,0,.42)),
            radial-gradient(circle at 54% 43%,rgba(255,128,22,.5),transparent 180px),
            url("https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1600&auto=format&fit=crop");
          opacity:1;
        }

        .hero-expanded .slide-two{
          background-image:
            linear-gradient(to bottom,rgba(0,20,40,.08),rgba(0,0,0,.46)),
            radial-gradient(circle at 48% 42%,rgba(60,150,255,.38),transparent 210px),
            url("https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=1600&auto=format&fit=crop");
          animation-delay:7s;
        }

        .hero-expanded .slide-three{
          background-image:
            linear-gradient(to bottom,rgba(18,26,38,.08),rgba(0,0,0,.5)),
            radial-gradient(circle at 55% 45%,rgba(255,100,40,.34),transparent 220px),
            url("https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=1600&auto=format&fit=crop");
          animation-delay:14s;
        }

        .hero-expanded .slide-four{
          background-image:
            linear-gradient(to bottom,rgba(12,24,38,.08),rgba(0,0,0,.48)),
            radial-gradient(circle at 52% 46%,rgba(255,180,55,.34),transparent 220px),
            url("https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1600&auto=format&fit=crop");
          animation-delay:21s;
        }

        .hero-expanded .slide-five{
          background-image:
            linear-gradient(to bottom,rgba(8,22,35,.08),rgba(0,0,0,.48)),
            radial-gradient(circle at 54% 43%,rgba(0,160,255,.34),transparent 220px),
            url("https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1600&auto=format&fit=crop");
          animation-delay:28s;
        }

        .hero-expanded .slide-six{
          background-image:
            linear-gradient(to bottom,rgba(20,36,52,.04),rgba(0,0,0,.42)),
            radial-gradient(circle at 54% 43%,rgba(255,130,40,.34),transparent 220px),
            url("https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?q=80&w=1600&auto=format&fit=crop");
          animation-delay:35s;
        }

        .hero-expanded .slide-seven{
          background-image:
            linear-gradient(to bottom,rgba(18,28,38,.08),rgba(0,0,0,.48)),
            radial-gradient(circle at 52% 46%,rgba(80,180,255,.28),transparent 220px),
            url("https://images.unsplash.com/photo-1580327344181-c1163234e5a0?q=80&w=1600&auto=format&fit=crop");
          animation-delay:42s;
        }

        .hero-expanded .slide-eight{
          background-image:
            linear-gradient(to bottom,rgba(10,18,26,.1),rgba(0,0,0,.5)),
            radial-gradient(circle at 52% 44%,rgba(255,160,55,.36),transparent 230px),
            url("https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2933620/header.jpg");
          animation-delay:49s;
        }

        @keyframes heroFade{
          0%{opacity:0;transform:scale(1.03);}
          3%{opacity:1;transform:scale(1.01);}
          9%{opacity:1;transform:scale(1);}
          12%{opacity:0;transform:scale(1);}
          100%{opacity:0;transform:scale(1.03);}
        }

        .hero-expanded:after{
          content:"";
          position:absolute;
          inset:0;
          background:
            linear-gradient(to bottom,transparent 42%,rgba(0,0,0,.42)),
            radial-gradient(circle at center,transparent 0%,rgba(0,0,0,.24) 100%);
          pointer-events:none;
          z-index:2;
        }

        .hero-title{
          position:absolute;
          left:-6.5%;
          right:0;
          bottom:14%;
          text-align:center;
          z-index:3;
        }

        .hero-main{
          font-size:clamp(40px,5.2vw,82px);
          line-height:.85;
          font-weight:900;
          font-style:italic;
          letter-spacing:-4px;
          background:linear-gradient(to bottom,#91e4ff,#189ce9 50%,#005aa8);
          -webkit-background-clip:text;
          color:transparent;
          text-shadow:
            0 2px 0 rgba(238,250,255,.78),
            0 5px 8px rgba(0,0,0,.95);
        }

        .hero-sub{
          margin-top:12px;
          font-size:clamp(9px,1vw,16px);
          color:#fff;
          letter-spacing:8px;
          font-weight:900;
          font-style:italic;
          text-shadow:0 2px 4px #000;
        }

        .footer-cover{
          position:absolute;
          left:1.05%;
          bottom:.7%;
          width:97.9%;
          height:4.45%;
          z-index:45;
          background:linear-gradient(to bottom,#063456,#041421);
          border:1px solid #006bad;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#e8f8ff;
          font-weight:700;
          text-shadow:0 1px 2px #000;
          font-size:clamp(10px,.95vw,16px);
        }

        .mobile-home{display:none;}

      @media(max-width:768px){
        html,body{
          width:100%;
          height:auto;
          min-height:100%;
          overflow-x:hidden;
          overflow-y:auto;
        }
        .page{
          width:100%;
          min-height:100vh;
          height:auto;
          padding:10px;
          align-items:flex-start;
          overflow:visible;
        }
        .homepage{
          width:100%;
          height:auto;
          min-height:100vh;
          aspect-ratio:auto;
          overflow:visible;
          filter:none;
          background:#06111c;
          border:1px solid #176095;
        }
        .dark-blue-blend,
        .controller-overlay,
        .hotspot,
        .drop-wrap,
        .search-box,
        .lower-layout,
        .footer-cover{display:none;}
        .real-top-bar{
          position:relative;
          width:100%;
          height:auto;
          min-height:44px;
          overflow:visible;
          padding:6px 10px;
        }
        .auth-holder{
          position:relative;
          inset:auto;
          width:100%;
          height:auto;
          justify-content:flex-start;
          white-space:normal;
        }
        .auth-holder .top-right-group{
          flex-wrap:wrap;
          gap:8px !important;
          min-height:36px;
        }
        .auth-holder .top-btn,
        .auth-holder .top-sep{
          min-height:36px;
          font-size:14px !important;
        }
        .top-help{display:none;}
        .mobile-home{
          display:block;
          padding:18px 14px 24px;
        }
        .mobile-home-hero{
          min-height:190px;
          display:flex;
          flex-direction:column;
          justify-content:flex-end;
          padding:20px;
          border:1px solid #24577b;
          background:
            linear-gradient(0deg,rgba(2,8,14,.96),rgba(2,8,14,.12)),
            url("/homepage.png") center 35% / cover no-repeat;
        }
        .mobile-home-title{
          color:#fff;
          font-size:clamp(27px,8vw,38px);
          font-weight:900;
          letter-spacing:.02em;
          line-height:1.05;
          text-shadow:0 2px 8px #000;
        }
        .mobile-home-tagline{
          margin-top:8px;
          color:#ffd95c;
          font-size:11px;
          font-weight:900;
          letter-spacing:.12em;
        }
        .mobile-home-section{margin-top:18px;}
        .mobile-home-heading{
          margin:0 0 10px;
          color:#ffd95c;
          font-size:13px;
          font-weight:900;
          letter-spacing:.08em;
          text-transform:uppercase;
        }
        .mobile-home-links{
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:9px;
        }
        .mobile-home-links a{
          min-height:48px;
          display:flex;
          align-items:center;
          padding:10px 12px;
          border:1px solid #1a4b70;
          background:linear-gradient(#102b41,#091725);
          color:#f3f8fc;
          font-size:13px;
          font-weight:700;
          line-height:1.35;
          overflow-wrap:anywhere;
        }
        .mobile-home-links a:active{background:#19486b;}
        .mobile-home-footer{
          margin-top:22px;
          padding-top:14px;
          border-top:1px solid #1a4b70;
          color:#9cb2c5;
          font-size:11px;
          line-height:1.5;
          text-align:center;
        }
        .mobile-home-cup{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          margin-top:14px;
          padding:13px;
          border:1px solid #876b24;
          background:linear-gradient(120deg,#211c0c,#0b1720);
        }
        .mobile-home-cup strong,.mobile-home-cup span{display:block;}
        .mobile-home-cup strong{color:#ffe28a;font-size:12px;letter-spacing:.06em;}
        .mobile-home-cup span{margin-top:5px;color:#c7d4df;font-size:11px;line-height:1.45;}
        .mobile-home-cup a{
          flex:none;
          padding:10px 12px;
          border-radius:5px;
          background:#d5a92f;
          color:#111;
          font-size:11px;
          font-weight:900;
          text-decoration:none;
        }
        .mobile-home-start p{margin:-3px 0 10px;color:#a8bfd1;font-size:12px;line-height:1.5;}
      }

      @media(max-width:360px){
        .page{padding:0;}
        .mobile-home{padding:14px 10px 20px;}
        .mobile-home-links{grid-template-columns:1fr;}
      `}</style>

      <main className="page">
        <div className="homepage">
          <div className="dark-blue-blend"></div>

          <div className="controller-overlay">
            <div className="controller-spin-ring"></div>

            <svg viewBox="0 0 260 180" aria-hidden="true">
              <defs>
                <linearGradient id="controllerBody" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="38%" stopColor="#d8dce0" />
                  <stop offset="72%" stopColor="#a7afb7" />
                  <stop offset="100%" stopColor="#6e7882" />
                </linearGradient>
                <linearGradient id="controllerEdge" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#3f4a55" />
                </linearGradient>
                <filter id="controllerShadow" x="-40%" y="-40%" width="180%" height="180%">
                  <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity=".8" />
                </filter>
              </defs>

              <path
                d="M55 69
                   C67 38 96 45 112 59
                   C119 65 125 67 130 67
                   C135 67 141 65 148 59
                   C164 45 193 38 205 69
                   C218 101 237 145 215 159
                   C194 173 171 135 158 120
                   C150 111 141 108 130 108
                   C119 108 110 111 102 120
                   C89 135 66 173 45 159
                   C23 145 42 101 55 69Z"
                fill="url(#controllerBody)"
                stroke="url(#controllerEdge)"
                strokeWidth="4"
                filter="url(#controllerShadow)"
              />

              <path d="M73 88 H102 V101 H73Z" fill="#003e68" />
              <path d="M81 80 H94 V109 H81Z" fill="#003e68" />

              <circle cx="177" cy="83" r="8" fill="#003e68" />
              <circle cx="198" cy="94" r="8" fill="#003e68" />
              <circle cx="177" cy="105" r="8" fill="#003e68" />
              <circle cx="156" cy="94" r="8" fill="#003e68" />

              <circle cx="118" cy="85" r="5" fill="#4f5f6c" />
              <circle cx="143" cy="85" r="5" fill="#4f5f6c" />

              <path
                d="M82 54
                   C88 20 125 16 143 48"
                fill="none"
                stroke="#e5edf4"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M86 54
                   C92 28 122 25 137 49"
                fill="none"
                stroke="#6d7a86"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="real-top-bar">
            <div className="auth-holder">
              <AuthNav />
            </div>

            <div className="top-help">
              <Link href="/support">Help</Link>
            </div>
          </div>

          <Link className="hotspot general" href="/general-info"></Link>
          <Link className="hotspot getting" href="/getting-started"></Link>

          <div className="drop-wrap nav-zone playstation">
            <Link className="drop-click" href="/ladders/playstation"></Link>
            <span className="nav-label">PLAYSTATION</span>
            <div className="dropdown">
              <Link href="/ladders/playstation/call-of-duty"><span className="game-icon cod-icon">COD</span>Call of Duty</Link>
              <Link href="/ladders/playstation/fortnite"><span className="game-icon fortnite-icon">FN</span>Fortnite</Link>
              <Link href="/ladders/playstation/apex"><span className="game-icon apex-icon">APX</span>Apex Legends</Link>
              <Link href="/ladders/playstation/rainbow-six"><span className="game-icon rainbow-icon">R6</span>Rainbow Six Siege</Link>
              <Link href="/ladders/playstation/rocket-league"><span className="game-icon rocket-icon">RL</span>Rocket League</Link>
              <Link href="/ladders/playstation/battlefield"><span className="game-icon battlefield-icon">BF</span>Battlefield</Link>
            </div>
          </div>

          <div className="drop-wrap nav-zone xbox">
            <Link className="drop-click" href="/ladders/xbox"></Link>
            <span className="nav-label">XBOX</span>
            <div className="dropdown">
              <Link href="/ladders/xbox/call-of-duty"><span className="game-icon cod-icon">COD</span>Call of Duty</Link>
              <Link href="/ladders/xbox/fortnite"><span className="game-icon fortnite-icon">FN</span>Fortnite</Link>
              <Link href="/ladders/xbox/apex"><span className="game-icon apex-icon">APX</span>Apex Legends</Link>
              <Link href="/ladders/xbox/rainbow-six"><span className="game-icon rainbow-icon">R6</span>Rainbow Six Siege</Link>
              <Link href="/ladders/xbox/rocket-league"><span className="game-icon rocket-icon">RL</span>Rocket League</Link>
              <Link href="/ladders/xbox/battlefield"><span className="game-icon battlefield-icon">BF</span>Battlefield</Link>
            </div>
          </div>

          <div className="drop-wrap nav-zone nintendo">
            <Link className="drop-click" href="/ladders/nintendo"></Link>
            <span className="nav-label">NINTENDO</span>
            <div className="dropdown">
              <Link href="/ladders/nintendo/fortnite"><span className="game-icon fortnite-icon">FN</span>Fortnite</Link>
              <Link href="/ladders/nintendo/apex"><span className="game-icon apex-icon">APX</span>Apex Legends</Link>
              <Link href="/ladders/nintendo/rocket-league"><span className="game-icon rocket-icon">RL</span>Rocket League</Link>
            </div>
          </div>

          <div className="drop-wrap nav-zone pc">
            <Link className="drop-click" href="/ladders/pc"></Link>
            <span className="nav-label">PC</span>
            <div className="dropdown">
              <Link href="/ladders/pc/call-of-duty"><span className="game-icon cod-icon">COD</span>Call of Duty</Link>
              <Link href="/ladders/pc/fortnite"><span className="game-icon fortnite-icon">FN</span>Fortnite</Link>
              <Link href="/ladders/pc/apex"><span className="game-icon apex-icon">APX</span>Apex Legends</Link>
              <Link href="/ladders/pc/rainbow-six"><span className="game-icon rainbow-icon">R6</span>Rainbow Six Siege</Link>
              <Link href="/ladders/pc/rocket-league"><span className="game-icon rocket-icon">RL</span>Rocket League</Link>
              <Link href="/ladders/pc/battlefield"><span className="game-icon battlefield-icon">BF</span>Battlefield</Link>
              <Link href="/ladders/pc/old-school"><span className="game-icon cod-icon">OS</span>Old School</Link>
            </div>
          </div>

          <div className="drop-wrap nav-zone mobile">
            <Link className="drop-click" href="/ladders/mobile"></Link>
            <span className="nav-label">MOBILE</span>
            <div className="dropdown">
              <Link href="/ladders/mobile/clash-of-clans"><span className="game-icon coc-icon">CoC</span>Clash of Clans</Link>
              <Link href="/ladders/mobile/clash-royale"><span className="game-icon cr-icon">CR</span>Clash Royale</Link>
              <Link href="/ladders/mobile/cod-mobile"><span className="game-icon cod-icon">CODM</span>Call of Duty: Mobile</Link>
              <Link href="/ladders/mobile/uno"><span className="game-icon uno-icon">UNO</span>UNO</Link>
            </div>
          </div>

          <Link className="hotspot nav-zone tournaments" href="/tournaments">
            <span className="nav-label">TOURNAMENTS</span>
          </Link>

          <Link className="hotspot nav-zone members" href="/members">
            <span className="nav-label">MEMBERS</span>
          </Link>
          <Link className="hotspot nav-zone forums" href="/forums">
            <span className="nav-label">FORUMS</span>
          </Link>
          <Link className="hotspot nav-zone staff-zone" href="/staff">
            <span className="nav-label">STAFF</span>
          </Link>

          <form className="search-box" action="/search">
            <input name="q" />
            <button className="search-button" type="submit"></button>
          </form>

          <div className="lower-layout">
            <aside className="left-panel">
              <div className="panel-title">Community</div>

              <Link className="side-link" href="/latest-news">Latest News <span className="arrow">›</span></Link>
              <Link className="side-link" href="/activity">Live Community <span className="arrow">›</span></Link>
              <Link className="side-link" href="/players/top">Top Players <span className="arrow">›</span></Link>
              <Link className="side-link" href="/suggestions">Suggestions Box <span className="arrow">›</span></Link>

              <div className="section-title">About GameBattles</div>

              <Link className="side-link" href="/about">About Us <span className="arrow">›</span></Link>
              <Link className="side-link" href="/history">History <span className="arrow">›</span></Link>
              <Link className="side-link" href="/rules">Rules <span className="arrow">›</span></Link>

              <div className="section-title">Contact Us</div>

              <Link className="side-link" href="/contact">Contact Page <span className="arrow">›</span></Link>
              <Link className="side-link" href="/support">Support Center <span className="arrow">›</span></Link>

              <div className="section-title">Social Links</div>

              <Link className="side-link" href="/social/discord">
                <span className="social"><span className="social-icon discord-icon">☯</span>Discord</span>
                <span className="arrow">›</span>
              </Link>
              <Link className="side-link" href="/social/x">
                <span className="social"><span className="social-icon x-icon">𝕏</span>X / Twitter</span>
                <span className="arrow">›</span>
              </Link>
              <Link className="side-link" href="/social/youtube">
                <span className="social"><span className="social-icon youtube-icon">▶</span>YouTube</span>
                <span className="arrow">›</span>
              </Link>
              <a className="side-link" href="https://www.tiktok.com/@gamebattlescommunity?lang=en" target="_blank" rel="noopener noreferrer">
                <span className="social"><span className="social-icon tiktok-icon">♪</span>TikTok</span>
                <span className="arrow">›</span>
              </a>
              <Link className="side-link" href="/social/facebook">
                <span className="social"><span className="social-icon facebook-icon">f</span>Facebook</span>
                <span className="arrow">›</span>
              </Link>
            </aside>

            <section className="hero-expanded">
              <HeroSlides />

              <div className="hero-title">
                <div className="hero-main">GAMEBATTLES</div>
                <div className="hero-sub">WHERE GAMING FINDS ITS EDGE</div>
              </div>
            </section>
          </div>

          <section className="mobile-home">
            <div className="mobile-home-hero">
              <div className="mobile-home-title">GAMEBATTLES</div>
              <div className="mobile-home-tagline">WHERE GAMING FINDS ITS EDGE</div>
            </div>
            <div className="mobile-home-cup">
              <div>
                <strong>FREE WEEKLY CUPS</strong>
                <span>Every Saturday · 8 PM Eastern · 5 credits and a winner award per player</span>
              </div>
              <Link href="/tournaments">See events</Link>
            </div>
            <div className="mobile-home-section mobile-home-start">
              <h2 className="mobile-home-heading">Jump in</h2>
              <p>Find a team, enter a free cup, and meet the players you’ll be competing against.</p>
              <div className="mobile-home-links">
                <Link href="/getting-started">Start here</Link>
                <Link href="/tournaments">Free tournaments</Link>
                <Link href="/activity">Live community</Link>
                <Link href="/matches/finder">Find a match</Link>
              </div>
            </div>
            <div className="mobile-home-section">
              <h2 className="mobile-home-heading">Compete</h2>
              <div className="mobile-home-links">
                <Link href="/ladders/playstation">PlayStation ladders</Link>
                <Link href="/ladders/xbox">Xbox ladders</Link>
                <Link href="/ladders/nintendo">Nintendo ladders</Link>
                <Link href="/ladders/pc">PC ladders</Link>
                <Link href="/ladders/mobile">Mobile ladders</Link>
                <Link href="/matches/finder">Find a match</Link>
                <Link href="/teams/top">Top teams</Link>
              </div>
            </div>
            <div className="mobile-home-section">
              <h2 className="mobile-home-heading">Community</h2>
              <div className="mobile-home-links">
                <Link href="/members">Members</Link>
                <Link href="/activity">Live community</Link>
                <Link href="/forums">Forums</Link>
                <Link href="/staff">Staff</Link>
                <Link href="/latest-news">Latest news</Link>
                <Link href="/players/top">Top players</Link>
                <Link href="/suggestions">Suggestions</Link>
              </div>
            </div>
            <div className="mobile-home-section">
              <h2 className="mobile-home-heading">GameBattles</h2>
              <div className="mobile-home-links">
                <Link href="/about">About us</Link>
                <Link href="/history">History</Link>
                <Link href="/rules">Rules</Link>
                <Link href="/getting-started">Getting started</Link>
                <Link href="/contact">Contact</Link>
                <Link href="/support">Support</Link>
                <a href="https://discord.gg/nKZdS2BDS6">Discord</a>
              </div>
            </div>
            <footer className="mobile-home-footer">
              © 2026 Competitive Gaming Network
            </footer>
          </section>

          <footer className="footer-cover">
            © 2026 Competitive Gaming Network
          </footer>
        </div>
      </main>
    </>
  );
}