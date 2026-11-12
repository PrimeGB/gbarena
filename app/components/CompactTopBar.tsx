import Link from "next/link";

export default function CompactTopBar() {
  return (
    <>
      <style>{`
        .gb-compact-top-bar{min-height:30px;background:linear-gradient(to bottom,#8b0000,#3b0000);border-bottom:1px solid #b32222;display:flex;align-items:center;justify-content:flex-end;gap:18px;padding:5px 14px;}
        .gb-compact-top-bar a{color:#fff;font-size:12px;font-weight:bold;text-transform:uppercase;text-decoration:none;}
        .gb-compact-top-bar a:hover,.gb-compact-top-bar a:focus-visible{color:#ffdc81;}
      `}</style>
      <nav className="gb-compact-top-bar" aria-label="Quick links">
        <Link href="/home">Home</Link>
        <Link href="/profile">My Profile</Link>
        <Link href="/forums">Forums</Link>
      </nav>
    </>
  );
}
