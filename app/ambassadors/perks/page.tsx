import Link from "next/link";

export default function AmbassadorPerksPage() {
  return (
    <main className="perks-page">
      <div className="wrap">
        <Link className="back" href="/ambassadors">← Ambassadors &amp; Affiliates</Link>
        <header className="hero">
          <div className="hero-copy">
            <span className="eyebrow"><i /> GAMEBATTLES CREATOR PROGRAM</span>
            <h1>Bring your people.<br /><em>Build your legacy.</em></h1>
            <p>Your community deserves a place to compete. You deserve recognition for bringing them together.</p>
            <div className="hero-actions"><Link href="/ambassadors/apply" className="apply">Apply Here <span>→</span></Link><a className="compare" href="#compare">Explore the perks ↓</a></div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="crest"><div className="crest-inner"><span>GB</span><small>CREATOR</small></div></div>
            <span className="art-note">YOUR COMMUNITY<br /><b>YOUR IMPACT</b></span>
          </div>
        </header>

        <section className="intro" id="compare">
          <span className="eyebrow">TWO WAYS TO REPRESENT</span>
          <h2>Find your place in the program.</h2>
          <p>Every creator starts with a link and a community. More qualified recruits unlock the next level.</p>
        </section>

        <div className="tiers">
          <section className="tier affiliate">
            <div className="tier-top"><div><span className="tier-number">01 / THE COMMUNITY BUILDER</span><h3>Affiliate</h3></div>
              <details className="profile-perks">
                <summary>Profile Perks <span>↗</span></summary>
                <div className="profile-popover">
                  <strong>Affiliate profile ideas</strong>
                  <p>Concept previews, not yet available to equip.</p>
                  <div className="badge-previews"><div><span className="badge-art silver-art">A</span><b>Affiliate</b></div><div><span className="badge-art silver-art">✦</span><b>Community Builder</b></div></div>
                  <div className="mini-banner"><span>GB</span><div><small>PROFILE BANNER CONCEPT</small><b>Your Name · Affiliate</b></div></div>
                </div>
              </details>
            </div>
            <p className="tier-desc">Bring your friends, grow your community and get recognized for making GameBattles bigger.</p>
            <div className="reward"><div><strong>2</strong><span>credits for<br />your recruit</span></div><div className="reward-plus">+</div><div><strong>1</strong><span>credit for<br />you</span></div><small>WHEN A PLAYER QUALIFIES</small></div>
            <h4>WHAT YOU GET</h4>
            <ul>
              <li><b>Your own recruit link</b><span>Share it with friends, followers and teammates.</span></li>
              <li><b>Affiliate profile award</b><span>Show your role in building the community.</span></li>
              <li><b>Creator directory listing</b><span>Help players discover your profile and channels.</span></li>
              <li><b>Distinctive profile banner <small>PLANNED</small></b><span>An Affiliate look at the top of your profile.</span></li>
              <li><b>A path to Ambassador</b><span>Reach 65 qualified recruits to move up.</span></li>
            </ul>
          </section>

          <section className="tier ambassador">
            <div className="tier-top"><div><span className="tier-number">02 / THE COMMUNITY LEADER</span><h3>Ambassador</h3></div>
              <details className="profile-perks">
                <summary>Profile Perks <span>↗</span></summary>
                <div className="profile-popover">
                  <strong>Ambassador profile ideas</strong>
                  <p>Concept previews, not yet available to equip.</p>
                  <div className="badge-previews"><div><span className="badge-art gold-art">★</span><b>Ambassador</b></div><div><span className="badge-art gold-art">✦</span><b>Community Leader</b></div></div>
                  <div className="mini-banner mini-gold"><span>GB</span><div><small>PROFILE BANNER CONCEPT</small><b>Your Name · Ambassador</b></div></div>
                </div>
              </details>
            </div>
            <p className="tier-desc">Take your community further with standout recognition, creator opportunities and more for your recruits.</p>
            <div className="reward"><div><strong>3</strong><span>credits for<br />your recruit</span></div><div className="reward-plus">+</div><div><strong>1</strong><span>credit for<br />you</span></div><small>WHEN A PLAYER QUALIFIES</small></div>
            <h4>EVERYTHING IN AFFILIATE, PLUS</h4>
            <ul>
              <li><b>Standout creator profile</b><span>Gold profile styling and an Ambassador award.</span></li>
              <li><b>Home page creator spotlight <small>PLANNED</small></b><span>Get your community and content in front of more players.</span></li>
              <li><b>Go Live follower alerts</b><span>Email eligible followers when alerts are enabled, subject to preferences and cooldowns.</span></li>
              <li><b>Tournaments in your name</b><span>Work with staff on an event for your community.</span></li>
              <li><b>Exclusive creator challenges <small>PLANNED</small></b><span>Special challenges built around your community.</span></li>
              <li><b>Early previews &amp; creator input <small>PLANNED</small></b><span>See what&apos;s coming and share ideas with the team.</span></li>
            </ul>
          </section>
        </div>

        <section className="identity">
          <div className="identity-copy"><span className="eyebrow">MADE TO STAND OUT</span><h2>Your profile.<br /><em>Your identity.</em></h2><p>From creator recognition to distinctive profile banners, your community can see what you bring to GameBattles.</p><span className="preview-label">CONCEPT PREVIEW · BANNERS PLANNED</span></div>
          <div className="banner-previews" aria-label="Concept previews of proposed creator profile banners">
            <div className="banner-preview silver"><div className="preview-avatar">A</div><div><small>GAMEBATTLES CREATOR</small><b>Your Name</b><span>AFFILIATE</span></div><strong>GB</strong></div>
            <div className="banner-preview gold-preview"><div className="preview-avatar">★</div><div><small>GAMEBATTLES CREATOR</small><b>Your Name</b><span>AMBASSADOR</span></div><strong>GB</strong></div>
          </div>
        </section>

        <div className="join"><div><span className="eyebrow">READY TO REPRESENT?</span><h2>Let&apos;s grow together.</h2><p>Apply to join the people building the GameBattles community.</p></div><Link href="/ambassadors/apply" className="apply">Apply Here <span>→</span></Link></div>
        <p className="details">A recruit qualifies after verifying their email and linking a qualifying gaming account. Their reward is based on your tier when they join. Existing members keep their earned awards and credits. Planned perks are still being developed.</p>
      </div>
      <style>{`
        .perks-page{min-height:100vh;background:#05090f;color:#c5d5e4;padding:26px 20px 60px;font-family:Tahoma,Verdana,Arial,sans-serif;overflow:hidden}
        .wrap{max-width:1060px;margin:auto}.back{color:#8fa9c2;font-size:12px;text-decoration:none}.back:hover{color:#f2c14e}
        .hero{position:relative;display:grid;grid-template-columns:1.15fr .85fr;align-items:center;min-height:310px;margin:22px 0 0;padding:40px 48px;overflow:hidden;border:1px solid #5b4926;background:radial-gradient(ellipse at 75% 30%,#71501a55,transparent 48%),linear-gradient(115deg,#101d2a,#11130f 58%,#1d1507);border-radius:12px}
        .hero:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(130deg,transparent 0,transparent 44px,#ffffff05 45px,#ffffff05 46px);pointer-events:none}
        .hero-copy{position:relative;z-index:1}.eyebrow{color:#e5bc66;font-size:10px;font-weight:900;letter-spacing:.18em}.eyebrow i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#f2c14e;margin-right:5px}
        h1{color:#fff;font-size:clamp(34px,4.7vw,53px);line-height:1.08;letter-spacing:-.035em;margin:15px 0}h1 em,.identity h2 em{font-style:normal;color:#f2c14e}.hero-copy p{color:#b4c5d4;line-height:1.7;font-size:13px;max-width:460px;margin:0}
        .hero-actions{display:flex;align-items:center;gap:22px;flex-wrap:wrap;margin-top:24px}.apply{display:inline-flex;align-items:center;gap:25px;padding:13px 20px;background:linear-gradient(#ffe49d,#e0a020);border-radius:4px;color:#231600;text-decoration:none;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 8px 26px #e0a02033}.apply span{font-size:17px}.compare{color:#d2dfeb;font-size:12px;text-decoration:none}.compare:hover{color:#f2c14e}
        .hero-art{position:relative;height:260px;display:grid;place-items:center}.orbit{position:absolute;border:1px solid #e8bc5c44;border-radius:50%;width:240px;height:240px}.orbit-two{width:195px;height:195px;border-style:dashed;transform:rotate(22deg)}
        .crest{position:relative;display:grid;place-items:center;width:157px;height:175px;clip-path:polygon(50% 0,94% 16%,90% 72%,50% 100%,10% 72%,6% 16%);background:linear-gradient(145deg,#fff1bc,#cf9a34 42%,#6e4811 72%,#f4cb70);filter:drop-shadow(0 10px 24px #d4942b55)}.crest-inner{display:flex;align-items:center;justify-content:center;flex-direction:column;width:143px;height:160px;clip-path:inherit;background:linear-gradient(145deg,#26394a,#080e15 65%);color:#fbe2a0}.crest-inner span{font-size:53px;font-weight:900;font-style:italic;letter-spacing:-.1em}.crest-inner small{font-size:8px;letter-spacing:.22em}
        .art-note{position:absolute;right:2px;bottom:15px;color:#9eabaf;font-size:9px;line-height:1.7;letter-spacing:.12em;text-align:right}.art-note b{color:#e6c679}
        .intro{text-align:center;padding:45px 10px 25px}.intro h2,.identity h2,.join h2{color:#fff;font-size:28px;letter-spacing:-.02em;margin:10px 0}.intro p,.identity p,.join p{color:#9fb4c8;line-height:1.65;font-size:13px;margin:0}
        .tiers{display:grid;grid-template-columns:1fr 1fr;gap:18px}.tier{position:relative;padding:26px;border:1px solid #34516a;border-radius:10px;background:linear-gradient(145deg,#102235,#09131e);overflow:hidden}.tier:before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#7898b5,#dcefff,#526d86)}.tier.ambassador{border-color:#795c20;background:linear-gradient(145deg,#211b0d,#10151a)}.tier.ambassador:before{background:linear-gradient(90deg,#94651b,#ffe398,#b47c24)}
        .tier-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.tier-number{font-size:9px;color:#91aac0;letter-spacing:.14em;font-weight:900}.ambassador .tier-number{color:#d5b66e}.tier h3{margin:8px 0;color:#e5f1fc;font-size:29px}.ambassador h3{color:#ffe09a}
        .profile-perks summary{list-style:none;cursor:pointer;white-space:nowrap;border:1px solid #52718a;border-radius:5px;padding:8px 10px;color:#d9ecf9;background:#152b3c;font-size:10px;font-weight:bold}.profile-perks summary::-webkit-details-marker{display:none}.profile-perks summary:hover,.profile-perks summary:focus-visible{border-color:#f2c14e;outline-color:#f2c14e}.profile-perks summary span{color:#e8c878}.ambassador .profile-perks summary{border-color:#927037;background:#332708;color:#ffe1a0}
        .profile-popover{position:absolute;z-index:3;top:76px;right:18px;width:min(290px,calc(100% - 36px));padding:16px;border:1px solid #69839a;border-radius:8px;background:#0b1722;box-shadow:0 12px 35px #000d}.ambassador .profile-popover{border-color:#a47a32;background:#17160f}.profile-popover>strong{display:block;color:#fff;font-size:13px}.profile-popover>p{margin:6px 0 12px;color:#9eb3c3;font-size:10px;line-height:1.5}.badge-previews{display:flex;gap:10px}.badge-previews>div{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:10px 4px;background:#ffffff08;border:1px solid #ffffff1a;border-radius:6px}.badge-previews b{color:#dbe7f0;font-size:9px}.badge-art{display:grid;place-items:center;width:43px;height:43px;clip-path:polygon(50% 0,95% 20%,85% 77%,50% 100%,15% 77%,5% 20%);font-size:19px;font-weight:900}.silver-art{background:linear-gradient(145deg,#eff9ff,#799bb7 60%,#354e66);color:#142b40}.gold-art{background:linear-gradient(145deg,#fff1b7,#e6b24e 60%,#80571c);color:#51380b}.mini-banner{display:flex;align-items:center;gap:10px;margin-top:10px;padding:10px;background:linear-gradient(110deg,#38556b,#132334);border-radius:5px}.mini-banner>span{font-size:19px;font-weight:900;color:#d3e8f7}.mini-banner div{display:flex;flex-direction:column;gap:3px}.mini-banner small{font-size:8px;letter-spacing:.08em;color:#a6c1d1}.mini-banner b{font-size:10px;color:#fff}.mini-gold{background:linear-gradient(110deg,#6b5120,#2a2314)}.mini-gold>span{color:#ffe09a}
        .tier-desc{min-height:42px;color:#adbfce;font-size:12.5px;line-height:1.65;margin:10px 0 18px}.reward{display:flex;align-items:center;gap:16px;flex-wrap:wrap;background:#050c13aa;border:1px solid #34516a;border-radius:7px;padding:12px 15px}.ambassador .reward{border-color:#674e20}.reward div:not(.reward-plus){display:flex;align-items:center;gap:8px}.reward strong{font-size:27px;color:#e6f4ff}.ambassador .reward strong{color:#ffdc88}.reward span{font-size:10px;line-height:1.35;color:#a8bdcd}.reward-plus{color:#7992a4}.reward small{margin-left:auto;color:#8296a8;font-size:8px;font-weight:bold;letter-spacing:.08em}
        .tier h4{font-size:9px;letter-spacing:.14em;color:#9fb4c8;margin:24px 0 14px}.ambassador h4{color:#c6a969}.tier ul{list-style:none;padding:0;margin:0}.tier li{position:relative;padding:0 0 13px 20px}.tier li:before{content:"✦";position:absolute;left:0;color:#8fb3d1}.ambassador li:before{color:#e9ba5a}.tier li b{display:block;color:#e5edf5;font-size:12px}.tier li span{display:block;color:#90a8ba;font-size:11px;line-height:1.5;margin-top:3px}.tier li small{font-size:8px;color:#f1c96e;letter-spacing:.08em;margin-left:4px}
        .identity{display:grid;grid-template-columns:1fr 1.2fr;gap:35px;align-items:center;margin-top:22px;padding:32px;border:1px solid #293d4d;border-radius:10px;background:linear-gradient(110deg,#0d1b29,#121816)}.identity h2{font-size:30px;line-height:1.15}.preview-label{display:block;margin-top:18px;color:#849caf;font-size:9px;font-weight:bold;letter-spacing:.1em}
        .banner-previews{display:grid;gap:10px}.banner-preview{display:flex;align-items:center;gap:12px;padding:13px;border:1px solid #526c81;border-radius:6px;background:linear-gradient(110deg,#253c50,#101b28);overflow:hidden}.gold-preview{border-color:#81652e;background:linear-gradient(110deg,#57451e,#191a16)}.preview-avatar{display:grid;place-items:center;width:43px;height:43px;border:2px solid #b5cfe2;border-radius:50%;font-weight:900;color:#e3f2ff;background:#172839}.gold-preview .preview-avatar{border-color:#f0c66f;color:#f7d888;background:#302409}.banner-preview div:nth-child(2){display:flex;flex-direction:column;gap:3px}.banner-preview small{font-size:8px;color:#a7bfce;letter-spacing:.12em}.banner-preview b{font-size:14px;color:#fff}.banner-preview span{font-size:9px;color:#c4dfef;font-weight:bold}.gold-preview span{color:#f3cb73}.banner-preview>strong{margin-left:auto;color:#ffffff17;font-size:38px;font-style:italic}
        .join{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:22px;padding:26px 30px;border-left:3px solid #e6b959;background:linear-gradient(90deg,#1d1b10,#0d1822)}.join h2{font-size:23px;margin:6px 0}.join .apply{flex:none}.details{max-width:800px;margin:22px auto 0;color:#8499ab;text-align:center;font-size:11px;line-height:1.7}
        @media(max-width:720px){.hero{grid-template-columns:1fr;padding:30px}.hero-art{display:none}.tiers,.identity{grid-template-columns:1fr}.tier-desc{min-height:0}.identity{gap:20px}.join{align-items:flex-start;flex-direction:column}}
        @media(max-width:400px){.perks-page{padding-left:12px;padding-right:12px}.hero,.tier,.identity{padding:22px}.reward{gap:9px}.reward small{width:100%;margin:0}}
      `}</style>
    </main>
  );
}
