export default function CompactTopBar() {
  return (
    <>
      <style>{`
        .gb-compact-top-bar{box-sizing:border-box;flex:none;min-height:30px;background:linear-gradient(to bottom,#8b0000,#3b0000);border-bottom:1px solid #b32222;display:flex;align-items:center;justify-content:flex-end;gap:18px;padding:5px 14px;font-family:Tahoma,Verdana,Arial,sans-serif;}
        .gb-compact-top-bar a{color:#fff;font-size:12px;font-weight:bold;text-transform:uppercase;text-decoration:none;white-space:nowrap;}
        .gb-compact-top-bar a:hover,.gb-compact-top-bar a:focus-visible{color:#ffdc81;}
      `}</style>
      <nav className="gb-compact-top-bar" aria-label="Quick links">
        {/* Full navigation preserves beforeunload warnings on unsaved forms. */}
        <a href="/home">Home</a>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/profile">Profile</a>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/forums">Forums</a>
      </nav>
    </>
  );
}
