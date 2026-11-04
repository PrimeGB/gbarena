import type { ReactNode } from "react";

export default function StatusScreen({
  code,
  title,
  message,
  children,
}: {
  code: string;
  title: string;
  message: string;
  children: ReactNode;
}) {
  return (
    <main className="status-screen">
      <div className="status-card">
        <div className="status-code">{code}</div>
        <h1>{title}</h1>
        <p>{message}</p>
        <div className="status-actions">{children}</div>
      </div>
      <style>{`
        .status-screen{min-height:100vh;display:grid;place-items:center;padding:24px;
          background:radial-gradient(circle at top,rgba(20,55,85,.35),transparent 45%),linear-gradient(#020202,#000);
          font-family:Tahoma,Verdana,Arial,sans-serif;color:#cfd6dc;}
        .status-card{max-width:460px;width:100%;text-align:center;padding:36px 28px;border-radius:16px;
          border:1px solid rgba(242,193,78,.35);background:linear-gradient(#0e2336,#07111b);
          box-shadow:0 12px 40px rgba(0,0,0,.6);}
        .status-code{font-size:64px;font-weight:900;color:#f2c14e;line-height:1;margin-bottom:8px;}
        .status-card h1{font-size:22px;color:#fff;margin-bottom:10px;}
        .status-card p{font-size:14px;line-height:1.5;margin-bottom:22px;}
        .status-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
        .status-btn{display:inline-block;padding:10px 20px;border-radius:999px;border:1px solid #f2c14e;
          background:linear-gradient(#f2c14e,#c9951f);color:#111;font:800 12px/1 Tahoma,Verdana,Arial,sans-serif;
          text-transform:uppercase;text-decoration:none;cursor:pointer;}
        .status-btn.ghost{background:transparent;color:#ffe9a8;}
      `}</style>
    </main>
  );
}
