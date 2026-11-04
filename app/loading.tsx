export default function Loading() {
  return (
    <div className="gb-loading" role="status" aria-label="Loading">
      <div className="gb-spinner" />
      <style>{`
        .gb-loading{min-height:60vh;display:grid;place-items:center;background:#000;}
        .gb-spinner{width:44px;height:44px;border-radius:50%;border:4px solid rgba(242,193,78,.2);border-top-color:#f2c14e;animation:gb-spin .8s linear infinite;}
        @keyframes gb-spin{to{transform:rotate(360deg);}}
      `}</style>
    </div>
  );
}
