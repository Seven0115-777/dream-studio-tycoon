"use client";

import { useEffect, useRef } from "react";

export function GameHeader({ level, year, cash, reputation, xpProgress }: { level: number; year: number; cash: string; reputation: number; xpProgress: number }) {
  return <header className="game-header">
    <div className="game-header__brand"><span>片</span><div><b>造梦片场</b><small>第 {year} 制片年</small></div></div>
    <div className="game-header__wallet"><small>可用资金</small><b>¥{cash}</b></div>
    <div className="game-header__progress"><span><b>Lv.{level}</b> 制片人</span><i><em style={{ width: `${xpProgress / 180 * 100}%` }} /></i><span>声望 {reputation}</span></div>
  </header>;
}

export function StageProgress({ stage, labels }: { stage: number; labels: string[] }) {
  const navRef = useRef<HTMLElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const active = activeRef.current;
    if (!nav || !active) return;
    nav.scrollTo({ left: Math.max(0, active.offsetLeft - nav.clientWidth / 2 + active.clientWidth / 2), behavior: "smooth" });
  }, [stage]);
  return <nav ref={navRef} className="stage-progress" aria-label="电影制作进度">
    <ol>{labels.map((label, index) => <li ref={index === stage ? activeRef : undefined} key={label} className={index === stage ? "active" : index < stage ? "done" : ""} aria-current={index === stage ? "step" : undefined}><i>{index < stage ? "✓" : index + 1}</i><span>{label}</span></li>)}</ol>
  </nav>;
}

export function ScreenHead({ code, title, accent, sub, stamp }: { code: string; title: string; accent: string; sub: string; stamp: string }) {
  return <div className="screen-head"><div><p>{code}</p><h1>{title}<em>{accent}</em></h1><span>{sub}</span></div><b>{stamp}</b></div>;
}

export function SectionTitle({ number, title, note }: { number: string; title: string; note: string }) {
  return <div className="section-title"><div><span>{number}</span><h2>{title}</h2></div><p>{note}</p></div>;
}

export function ActionBar({ label, detail, button, disabled, onClick, back }: { label: string; detail: string; button: string; disabled: boolean; onClick: () => void; back?: () => void }) {
  return <div className="action-bar"><div className="action-bar__summary"><small>{label}</small><span>{detail}</span></div><div className="action-bar__buttons">{back && <button className="back-button" onClick={back} aria-label="返回上一步">‹</button>}<button className="primary-action" disabled={disabled} onClick={onClick}>{button}<i>→</i></button></div></div>;
}

export function Metric({ label, value }: { label: string; value: number }) {
  return <div className="metric"><span>{label}</span><div><i style={{ width: `${Math.min(100, value)}%` }} /></div><b>{value}</b></div>;
}

export function ResultStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return <div><span>{label}</span><b>{value}<small>{unit}</small></b></div>;
}
