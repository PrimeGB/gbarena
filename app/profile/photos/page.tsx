"use client";

import { useState } from "react";

export default function ProfilePhotosPage() {
  const [photos, setPhotos] = useState<string[]>([]);

  function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);

    if (photos.length + files.length > 8) {
      alert("You can only upload 8 photos.");
      return;
    }

    const newPhotos = files.map((file) => URL.createObjectURL(file));

    setPhotos([...photos, ...newPhotos]);
  }

  function removePhoto(indexToRemove: number) {
    setPhotos(photos.filter((_, index) => index !== indexToRemove));
  }

  return (
    <>
      <style>{`
        body{
          margin:0;
          background:#000;
          font-family:Tahoma,Verdana,Arial,sans-serif;
          color:#d7e2ee;
        }

        a{
          text-decoration:none;
        }

        .wrapper{
          width:1040px;
          margin:0 auto;
        }

        .top-strip{
          height:22px;
          background:linear-gradient(to bottom,#c40000,#6a0000);
          border-bottom:1px solid #140000;
          display:flex;
          justify-content:flex-end;
          align-items:center;
          padding:0 12px;
        }

        .top-strip a{
          color:#fff;
          font-size:10px;
          font-weight:bold;
          margin-left:12px;
        }

        .header{
          height:86px;
          background:#0a1622;
          border-left:1px solid #3b7fc2;
          border-right:1px solid #3b7fc2;
          border-bottom:2px solid #4f93d6;
          display:flex;
          align-items:center;
          padding:0 14px;
        }

        .logo-main{
          font-size:28px;
          font-weight:bold;
          color:#eaf5ff;
        }

        .logo-sub{
          color:#f2c14e;
          font-size:10px;
          text-transform:uppercase;
          margin-top:4px;
        }

        .title-bar{
          margin-top:8px;
          height:34px;
          background:linear-gradient(to bottom,#1f4c73,#0b2438);
          border:1px solid #3b7fc2;
          display:flex;
          align-items:center;
          padding-left:10px;
          color:#f2c14e;
          font-size:15px;
          font-weight:bold;
          text-transform:uppercase;
        }

        .tabs{
          height:28px;
          background:#07111b;
          border-left:1px solid #3b7fc2;
          border-right:1px solid #3b7fc2;
          border-bottom:1px solid #3b7fc2;
          display:flex;
          align-items:flex-end;
          padding-left:8px;
        }

        .tab{
          height:22px;
          padding:5px 12px 0;
          background:#0f2a40;
          border:1px solid #3b7fc2;
          border-bottom:none;
          color:#d7eaff;
          font-size:10px;
          margin-right:4px;
        }

        .tab.active{
          background:#173b59;
          color:#fff;
          font-weight:bold;
        }

        .box{
          background:#07111b;
          border:1px solid #3b7fc2;
          margin-top:8px;
        }

        .box-title{
          height:23px;
          background:linear-gradient(to bottom,#1f4c73,#0b2438);
          border-bottom:1px solid #3b7fc2;
          color:#f2c14e;
          font-weight:bold;
          font-size:10px;
          text-transform:uppercase;
          display:flex;
          align-items:center;
          padding-left:8px;
        }

        .box-body{
          padding:8px;
        }

        .upload-area{
          border:1px solid #315d86;
          background:#0a1622;
          padding:12px;
          margin-bottom:10px;
          font-size:11px;
        }

        .upload-area p{
          margin:0 0 8px;
          color:#d7eaff;
        }

        .upload-area strong{
          color:#f2c14e;
        }

        .upload-input{
          color:#d7eaff;
          font-size:10px;
        }

        .photo-grid{
          display:grid;
          grid-template-columns:repeat(4, 1fr);
          gap:8px;
        }

        .photo-card{
          border:1px solid #315d86;
          background:#0a1622;
          padding:6px;
        }

        .photo-preview{
          width:100%;
          height:130px;
          background:#000;
          border:1px solid #13293d;
          object-fit:cover;
          display:block;
        }

        .empty-photo{
          height:130px;
          background:#0c1c2b;
          border:1px solid #315d86;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#5d86aa;
          font-size:10px;
        }

        .remove-btn{
          width:100%;
          margin-top:6px;
          padding:6px;
          background:linear-gradient(to bottom,#c40000,#6a0000);
          border:1px solid #ff4d4d;
          color:#fff;
          font-size:10px;
          font-weight:bold;
          cursor:pointer;
        }

        .footer{
          margin-top:8px;
          height:26px;
          background:#0a1622;
          border:1px solid #3b7fc2;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#a9c3db;
          font-size:10px;
        }
      `}</style>

      <div className="top-strip">
        <a href="/">Home</a>
        <a href="/profile">My Profile</a>
      </div>

      <div className="wrapper">
        <header className="header">
          <div>
            <div className="logo-main">GameBattles</div>
            <div className="logo-sub">Where Gaming Finds Its Edge</div>
          </div>
        </header>

        <div className="title-bar">My Photos</div>

        <div className="tabs">
          <a className="tab" href="/profile">Profile</a>
          <a className="tab" href="/profile/teams">Teams</a>
          <a className="tab" href="/profile/matches">Matches</a>
          <a className="tab active" href="/profile/photos">Photos</a>
          <a className="tab" href="/profile/friends">Friends</a>
        </div>

        <div className="box">
          <div className="box-title">Photo Uploads</div>

          <div className="box-body">
            <div className="upload-area">
              <p>
                <strong>{photos.length}/8 photos uploaded.</strong>
              </p>

              <p>
                Upload up to 8 photos here. Your main profile page will still only show 4 photos at a time.
              </p>

              <input
                className="upload-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                disabled={photos.length >= 8}
              />
            </div>

            <div className="photo-grid">
              {Array.from({ length: 8 }).map((_, index) => {
                const photo = photos[index];

                return (
                  <div className="photo-card" key={index}>
                    {photo ? (
                      <>
                        <img className="photo-preview" src={photo} alt={`Uploaded photo ${index + 1}`} />

                        <button
                          className="remove-btn"
                          onClick={() => removePhoto(index)}
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <div className="empty-photo">
                        Empty Slot {index + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="footer">
          © 2026 Competitive Gaming Network
        </footer>
      </div>
    </>
  );
}