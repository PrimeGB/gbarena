"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import AwardArt from "../awards/AwardArt";

export type EarnedAwardDetails = {
  id: number;
  name: string;
  award_group: string;
  granted_at: string;
  reason: string | null;
};

type CatalogAward = { name: string; purpose: string };

export default function AwardDetailsDialog({ award, playerName, onClose }: {
  award: EarnedAwardDetails | null;
  playerName: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [catalog, setCatalog] = useState<CatalogAward[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const isOpen = award !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    else if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || catalog) return;
    let active = true;
    void supabase.rpc("staff_public_award_catalog").then(
      ({ data, error: catalogError }) => {
        if (!active) return;
        if (catalogError) setError(`Award details could not be loaded: ${catalogError.message}`);
        else {
          setCatalog((data || []) as CatalogAward[]);
          setError("");
        }
      },
      (failure: unknown) => {
        if (active) setError(`Award details could not be loaded: ${failure instanceof Error ? failure.message : "Unexpected error"}`);
      }
    );
    return () => { active = false; };
  }, [isOpen, catalog, attempt]);

  const purpose = catalog?.find((item) => item.name === award?.name)?.purpose;
  const date = award ? new Date(award.granted_at) : null;
  const validDate = date && Number.isFinite(date.getTime());
  const specificReason = award?.reason && !award.reason.startsWith("Awarded automatically:") ? award.reason : null;

  return (
    <>
      <dialog className="award-details-dialog" ref={dialogRef} aria-labelledby="award-details-title" onClose={() => {
        setError("");
        onClose();
      }}>
        {award && (
          <>
            <div className="award-details-head">
              <span>{award.award_group}</span>
              <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close award details">×</button>
            </div>
            <div className="award-details-art"><AwardArt name={award.name} group={award.award_group} height={120} /></div>
            <h2 id="award-details-title">{award.name}</h2>
            <div className="award-details-info">
              <h3>How it&apos;s earned</h3>
              {error ? (
                <p role="alert">{error} <button type="button" onClick={() => { setError(""); setAttempt((value) => value + 1); }}>Try again</button></p>
              ) : !catalog ? <p>Loading award details...</p>
                : <p>{purpose || "Award description is unavailable."}</p>}
              {specificReason && <><h3>Awarded for</h3><p>{specificReason}</p></>}
              <h3>Earned by {playerName}</h3>
              {validDate && date
                ? <p><time dateTime={award.granted_at}>{date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</time></p>
                : <p>Earned date is unavailable.</p>}
            </div>
          </>
        )}
      </dialog>
      <style>{`
        .award-details-dialog{box-sizing:border-box;width:min(400px,calc(100% - 32px));max-height:calc(100% - 32px);margin:auto;padding:0;border:1px solid #416d90;border-radius:6px;background:#081521;color:#d7e6f2;font-family:Tahoma,Verdana,Arial,sans-serif;box-shadow:0 16px 50px #000b}
        .award-details-dialog::backdrop{background:rgba(0,0,0,.78)}
        .award-details-head{display:flex;align-items:center;justify-content:space-between;padding:9px 13px;background:linear-gradient(#173c5a,#0c2336);color:#e0bb68;font-size:10px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase}
        .award-details-head button{width:30px;height:30px;border:0;background:transparent;color:#d7e6f2;font-size:24px;line-height:1;cursor:pointer}
        .award-details-art{display:flex;justify-content:center;align-items:center;min-height:130px;padding:8px;background:radial-gradient(circle,#173c59,#081521 70%)}
        .award-details-dialog h2{margin:0;padding:4px 16px 12px;color:#fff;text-align:center;font-size:18px}
        .award-details-info{padding:0 18px 18px}
        .award-details-info h3{margin:14px 0 4px;color:#e0bb68;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
        .award-details-info p{margin:0;color:#d7e6f2;font-size:13px;line-height:1.55;overflow-wrap:anywhere}
        .award-details-info button{border:0;background:transparent;color:#80c8ff;font:inherit;text-decoration:underline;cursor:pointer}
        .award-details-dialog button:focus-visible{outline:2px solid #80c8ff;outline-offset:2px}
      `}</style>
    </>
  );
}
