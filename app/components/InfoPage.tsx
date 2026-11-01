import Link from "next/link";
import type { ReactNode } from "react";

export default function InfoPage({
  title,
  eyebrow,
  backHref = "/",
  backLabel = "Back to Home",
  children,
}: {
  title: string;
  eyebrow?: string;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
}) {
  return (
    <>
      <style>{`
        .info-bg{min-height:100vh;background:radial-gradient(circle at top,rgba(45,100,150,.28),transparent 42%),linear-gradient(to bottom,#02060a,#000);padding:32px 22px;font-family:Tahoma,Verdana,Arial,sans-serif;color:#d7e2ee;}
        .info-wrap{width:900px;max-width:100%;margin:0 auto;background:#07111b;border:1px solid #315f88;box-shadow:0 0 28px rgba(0,80,140,.38),inset 0 0 22px rgba(0,0,0,.72);}
        .info-head{padding:22px 26px;background:linear-gradient(to bottom,#173956,#07111b);border-bottom:2px solid #315f88;}
        .info-eyebrow{color:#f2c14e;font-size:12px;font-weight:900;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;}
        .info-title{color:#fff;font-size:30px;font-weight:900;text-transform:uppercase;text-shadow:0 2px 4px #000;}
        .info-body{padding:24px 26px;font-size:14px;line-height:23px;}
        .info-body h2{color:#f2c14e;font-size:15px;text-transform:uppercase;margin:20px 0 8px;border-bottom:1px solid #244b70;padding-bottom:6px;}
        .info-body h2:first-child{margin-top:0;}
        .info-body p{margin-bottom:12px;}
        .info-body ul{margin:8px 0 14px 22px;}
        .info-body li{margin-bottom:6px;}
        .info-body a{color:#67bdff;}
        .info-links{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;}
        .info-links a{display:inline-block;padding:9px 16px;background:linear-gradient(to bottom,#1d6fb0,#0d3f6b);border:1px solid #4aa3e6;color:#fff;font-weight:bold;font-size:13px;text-decoration:none;}
        .info-foot{padding:14px 26px;border-top:1px solid #244b70;}
      `}</style>
      <main className="info-bg">
        <section className="info-wrap">
          <header className="info-head">
            {eyebrow && <div className="info-eyebrow">{eyebrow}</div>}
            <h1 className="info-title">{title}</h1>
          </header>
          <div className="info-body">{children}</div>
          <div className="info-foot">
            <Link href={backHref}>← {backLabel}</Link>
          </div>
        </section>
      </main>
    </>
  );
}
