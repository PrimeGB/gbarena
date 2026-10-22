"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type StaffDirectoryEntry = {
  user_id: string;
  username: string;
  position: string;
  duties: string;
  is_owner: boolean;
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [directoryUnavailable, setDirectoryUnavailable] = useState(false);

  useEffect(() => {
    async function loadStaff() {
      try {
        const { data, error: directoryError } = await supabase.rpc(
          "get_staff_directory"
        );

        if (directoryError) {
          console.error("Staff directory could not be loaded:", directoryError);
          setDirectoryUnavailable(true);
          setLoading(false);
          return;
        }

        setStaff((data || []) as StaffDirectoryEntry[]);
        setLoading(false);
      } catch (directoryError) {
        console.error("Staff directory request failed:", directoryError);
        setDirectoryUnavailable(true);
        setLoading(false);
      }
    }

    void loadStaff();
  }, []);

  return (
    <main className="staff-page">
      <style>{`
        *{box-sizing:border-box;}
        body{margin:0;background:#02060a;color:#d7e2ee;font-family:Tahoma,Verdana,Arial,sans-serif;}
        a{text-decoration:none;}
        .staff-page{
          min-height:100vh;
          padding:32px 18px;
          background:radial-gradient(circle at top,rgba(45,100,150,.24),transparent 45%),#02060a;
        }
        .staff-wrap{
          max-width:1050px;
          margin:0 auto;
          background:#07111b;
          border:1px solid #315f88;
          box-shadow:0 0 28px rgba(0,80,140,.3);
        }
        .topbar{
          min-height:34px;
          display:flex;
          align-items:center;
          justify-content:flex-end;
          gap:18px;
          padding:6px 14px;
          background:linear-gradient(to bottom,#8b0000,#3b0000);
          border-bottom:1px solid #b32222;
        }
        .topbar a{color:#fff;font-size:11px;font-weight:bold;text-transform:uppercase;}
        .masthead{
          min-height:112px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:18px;
          padding:20px 24px;
          background:linear-gradient(to bottom,#173956,#07111b);
          border-bottom:2px solid #315f88;
        }
        .site-title{color:#f2c14e;font-size:30px;font-weight:900;text-transform:uppercase;}
        .site-subtitle{margin-top:7px;color:#cfe2f2;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;}
        .login-button{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          min-height:42px;
          padding:0 18px;
          border:1px solid #e34242;
          background:linear-gradient(to bottom,#bd1717,#5c0000);
          color:#fff;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          white-space:nowrap;
        }
        .login-button:hover{filter:brightness(1.15);}
        .page-title{
          padding:17px 20px;
          background:linear-gradient(to bottom,#18344f,#091521);
          border-bottom:1px solid #244b70;
          color:#d7ad4a;
          font-size:16px;
          font-weight:900;
          text-transform:uppercase;
        }
        .intro{padding:18px 20px;color:#cfe2f2;font-size:13px;line-height:21px;}
        .roster{padding:0 20px 20px;}
        .roster-heading{
          margin-bottom:10px;
          padding:10px 12px;
          background:#0d2235;
          border:1px solid #244b70;
          color:#f2c14e;
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
        }
        .staff-row{
          display:grid;
          grid-template-columns:minmax(120px,1fr) 2fr;
          gap:16px;
          align-items:center;
          padding:14px 12px;
          background:#050b12;
          border:1px solid #244b70;
          border-top:0;
        }
        .role{color:#f2c14e;font-size:13px;font-weight:900;text-transform:uppercase;}
        .person{color:#fff;font-size:14px;font-weight:bold;}
        .description{margin-top:4px;color:#91abc1;font-size:11px;}
        .notice{
          margin:0 20px 20px;
          padding:12px 14px;
          background:#0b1823;
          border:1px solid #244b70;
          color:#91abc1;
          font-size:11px;
          line-height:18px;
        }
        .footer{
          padding:12px;
          border-top:1px solid #244b70;
          color:#a9c3db;
          font-size:11px;
          text-align:center;
        }
        @media(max-width:600px){
          .staff-page{padding:12px 10px;}
          .staff-wrap{width:100%;overflow:hidden;}
          .topbar{justify-content:center;flex-wrap:wrap;gap:12px;padding:10px;}
          .topbar a{min-height:36px;display:inline-flex;align-items:center;}
          .masthead{align-items:stretch;flex-direction:column;padding:18px 16px;gap:14px;}
          .site-title{font-size:clamp(22px,7vw,30px);overflow-wrap:anywhere;}
          .site-subtitle{font-size:10px;line-height:1.5;letter-spacing:.6px;}
          .login-button{width:100%;min-height:46px;}
          .page-title{padding:14px 16px;font-size:15px;}
          .intro{padding:14px 16px;font-size:14px;line-height:1.6;}
          .roster{padding:0 12px 14px;}
          .roster-heading{margin-bottom:8px;}
          .staff-row{grid-template-columns:1fr;gap:7px;padding:13px 11px;}
          .role,.person,.description{overflow-wrap:anywhere;line-height:1.5;}
          .notice{margin:0 12px 14px;padding:12px;font-size:12px;}
          .footer{padding:14px 10px;line-height:1.6;}
        }
      `}</style>

      <div className="staff-wrap">
        <nav className="topbar" aria-label="Staff navigation">
          <Link href="/home">Home</Link>
          <Link href="/forums">Forums</Link>
          <Link href="/staff/awards">Awards Center</Link>
        </nav>

        <header className="masthead">
          <div>
            <div className="site-title">GameBattles Staff</div>
            <div className="site-subtitle">Community team and match officials</div>
          </div>
          <Link className="login-button" href="/login?next=%2Fstaff%2Fdashboard">
            Staff Login
          </Link>
        </header>

        <div className="page-title">Staff Directory</div>
        <p className="intro">
          Meet the team responsible for supporting the GameBattles community and fair competition.
        </p>

        <section className="roster" aria-label="Staff roles">
          <div className="roster-heading">Staff members</div>
          {loading && <p className="intro">Loading the staff directory...</p>}
          {directoryUnavailable && (
            <p className="intro">
              The staff directory is being set up. Please check back soon.
            </p>
          )}
          {!loading && !directoryUnavailable && staff.length === 0 && (
            <p className="intro">No staff positions have been assigned yet.</p>
          )}
          {staff.map((member) => (
            <div className="staff-row" key={member.user_id}>
              <div className="role">{member.position}</div>
              <div>
                <div className="person">{member.username}</div>
                <div className="description">{member.duties}</div>
              </div>
            </div>
          ))}
        </section>

        <div className="notice">
          Staff work areas are granted individually. Only the Owner can assign or remove
          staff access; having a staff position does not grant access to unrelated areas.
        </div>

        <footer className="footer">
          <Link href="/login?next=%2Fstaff%2Fdashboard">Open Staff Portal</Link>
          {" · "}© 2026 Competitive Gaming Network
        </footer>
      </div>
    </main>
  );
}
