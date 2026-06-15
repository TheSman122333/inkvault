'use client';
import { useState } from 'react';
import { markNoteUnlocked, deleteLockedNote, type LockedNote } from '@/db';
import { toDateStr } from '@/utils/date';

interface Props {
  note: LockedNote;
  currentStreak: number;
  onUpdate: () => void;
}

export default function LockedNoteCard({ note, currentStreak, onUpdate }: Props) {
  const [showDelete, setShowDelete] = useState(false);

  const today = toDateStr();
  const isUnlocked =
    !!note.unlockedAt ||
    (note.unlockType === 'date' && !!note.unlockDate && today >= note.unlockDate) ||
    (note.unlockType === 'streak' && !!note.unlockStreak && currentStreak >= note.unlockStreak);

  const handleUnlock = async () => {
    if (!note.unlockedAt && isUnlocked) {
      await markNoteUnlocked(note.id);
      onUpdate();
    }
  };

  const handleDelete = async () => {
    await deleteLockedNote(note.id);
    setShowDelete(false);
    onUpdate();
  };

  const unlockLabel = () => {
    if (note.unlockType === 'date' && note.unlockDate) {
      const d = new Date(note.unlockDate + 'T00:00:00');
      return `Unlocks ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (note.unlockType === 'streak' && note.unlockStreak) {
      const remaining = note.unlockStreak - currentStreak;
      if (remaining <= 0) return `Streak reached — tap to unlock`;
      return `Unlocks at ${note.unlockStreak} day streak (${remaining} to go)`;
    }
    return 'Locked';
  };

  return (
    <>
      <div
        className={`border border-ink-200 p-5 mb-4 ${isUnlocked ? 'bg-paper' : 'bg-paper-dark'}`}
        onClick={isUnlocked && !note.unlockedAt ? handleUnlock : undefined}
        style={{ cursor: isUnlocked && !note.unlockedAt ? 'pointer' : 'default' }}
      >
        <div className="flex justify-between items-start mb-3">
          <p className="font-serif text-base text-ink-950 flex-1 pr-2">{note.title}</p>
          <button
            onClick={e => { e.stopPropagation(); setShowDelete(true); }}
            className="font-mono text-[12px] text-ink-200 hover:text-ink-600 ml-2 px-1"
            title="Delete"
          >
            ×
          </button>
        </div>

        {isUnlocked ? (
          <div>
            <p className="font-serif text-sm text-ink-950 leading-relaxed whitespace-pre-wrap">{note.content}</p>
            <p className="font-mono text-[9px] text-ink-400 mt-3 tracking-wide">UNLOCKED</p>
          </div>
        ) : (
          <div>
            <div className="relative">
              <p className="font-serif text-sm text-ink-400 leading-relaxed select-none" style={{ filter: 'blur(3px)' }}>
                {note.content.slice(0, 120).replace(/./g, '◆')}
              </p>
              <div className="absolute inset-0" />
            </div>
            <p className="font-mono text-[9px] text-ink-600 mt-3 tracking-wide">{unlockLabel()}</p>
          </div>
        )}
      </div>

      {showDelete && (
        <div className="fixed inset-0 bg-ink-950/40 flex items-center justify-center px-6 z-50"
          onClick={() => setShowDelete(false)}>
          <div className="bg-paper border border-ink-200 p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <p className="font-mono text-[10px] text-ink-400 tracking-[2px] mb-2">DELETE NOTE</p>
            <p className="font-serif text-base text-ink-950 mb-1">{note.title}</p>
            <p className="font-serif text-sm text-ink-400 mb-6">This cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowDelete(false)}
                className="font-mono text-[11px] text-ink-400 tracking-[2px] py-1 px-3">CANCEL</button>
              <button onClick={handleDelete}
                className="font-mono text-[11px] text-paper tracking-[2px] bg-ink-950 py-1 px-3">DELETE</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
