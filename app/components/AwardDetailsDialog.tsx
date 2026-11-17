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

function AwardPurpose({ purpose }: { purpose: string }) {
  const concise = purpose.replace(/^Awarded automatically (?:when|after) you ([a-z])/i, (_, first: string) => first.toUpperCase());
  const sentences = concise.trim().split(/(?<=[.!?])\s+(?=[A-Z0-9])/);

  if (sentences.length === 1) return <span>{sentences[0]}</span>;
  return <ul className="award-purpose-list">{sentences.map((sentence, index) => <li key={index}>{sentence}</li>)}</ul>;
}

export function useAwardCatalog(enabled: boolean) {
  const [catalog, setCatalog] = useState<CatalogAward[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || catalog) return;
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
  }, [enabled, catalog, attempt]);

  return { catalog, error, retry: () => { setError(""); setAttempt((value) => value + 1); } };
}

export function AwardHoverDetails({ award, playerName, catalogState, id }: {
  award: EarnedAwardDetails;
  playerName: string;
  catalogState: ReturnType<typeof useAwardCatalog>;
  id: string;
}) {
  const purpose = catalogState.catalog?.find((item) => item.name === award.name)?.purpose;
  const date = new Date(award.granted_at);

  return (
    <div className="pf-award-tooltip" role="tooltip" id={id}>
      <strong>{award.name}</strong>
      {catalogState.error ? <span>Award description could not be loaded. Click to see the error and retry.</span>
        : !catalogState.catalog ? <span>Loading award details...</span>
          : purpose ? <AwardPurpose purpose={purpose} /> : <span>Award description is unavailable.</span>}
      <span className="pf-award-tooltip-meta">Earned by {playerName} · {Number.isFinite(date.getTime()) ? <time dateTime={award.granted_at}>{date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</time> : "Date unavailable"}</span>
    </div>
  );
}

export default function AwardDetailsDialog({ award, playerName, onClose, catalogState }: {
  award: EarnedAwardDetails | null;
  playerName: string;
  onClose: () => void;
  catalogState?: ReturnType<typeof useAwardCatalog>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = award !== null;
  const localCatalog = useAwardCatalog(isOpen && !catalogState);
  const { catalog, error, retry } = catalogState || localCatalog;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    else if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const purpose = catalog?.find((item) => item.name === award?.name)?.purpose;
  const date = award ? new Date(award.granted_at) : null;
  const validDate = date && Number.isFinite(date.getTime());
  const specificReason = award?.reason && !award.reason.startsWith("Awarded automatically:") ? award.reason : null;

  return (
    <>
      <dialog className="award-details-dialog" ref={dialogRef} aria-labelledby="award-details-title" onClose={() => {
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
              <h3>How to earn it</h3>
              {error ? (
                <p role="alert">{error} <button type="button" onClick={retry}>Try again</button></p>
              ) : !catalog ? <p>Loading award details...</p>
                : purpose ? <div className="award-details-purpose"><AwardPurpose purpose={purpose} /></div>
                  : <p>Award description is unavailable.</p>}
              {specificReason && <><h3>Awarded for</h3><p>{specificReason}</p></>}
              <div className="award-details-recipient">
                <div><h3>Earned by</h3><p>{playerName}</p></div>
                <div><h3>Date earned</h3>{validDate && date
                  ? <p><time dateTime={award.granted_at}>{date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</time></p>
                  : <p>Unavailable</p>}</div>
              </div>
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
        .award-details-info{padding:0 20px 20px}
        .award-details-info h3{margin:16px 0 6px;color:#e0bb68;font-size:10px;text-transform:uppercase;letter-spacing:.08em}
        .award-details-info p,.award-details-purpose{margin:0;color:#d7e6f2;font-size:13px;line-height:1.6;overflow-wrap:anywhere}
        .award-details-purpose .award-purpose-list{margin:0;padding-left:18px;list-style:disc}
        .award-details-purpose .award-purpose-list li + li{margin-top:5px}
        .award-details-purpose .award-purpose-list li::marker{color:#e0bb68}
        .award-details-recipient{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px;padding-top:2px;border-top:1px solid #26435a}
        .award-details-recipient h3{margin-top:12px}
        .award-details-info button{border:0;background:transparent;color:#80c8ff;font:inherit;text-decoration:underline;cursor:pointer}
        .award-details-dialog button:focus-visible{outline:2px solid #80c8ff;outline-offset:2px}
      `}</style>
    </>
  );
}
