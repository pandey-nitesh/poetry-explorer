import { useState } from 'react';
import type { Poem } from '../api/types';
import { buildPoemPath } from '../lib/identity';
import { SaveButton } from './SaveButton';
import styles from './PoemView.module.css';

interface Props {
  poem: Poem;
}

type Flash = 'text' | 'link' | null;

function pageOrigin(): string {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  }
}

// The reading layout. Poem lines render verbatim: leading spaces (via pre-wrap) and
// blank-line stanza breaks (via :empty::before) are preserved, never trimmed. (SPEC §10, §12, §16 #9)
export function PoemView({ poem }: Props) {
  const [flash, setFlash] = useState<Flash>(null);

  function showFlash(which: Exclude<Flash, null>) {
    setFlash(which);
    window.setTimeout(() => setFlash(null), 1500);
  }

  async function copyPoem() {
    await copyToClipboard([poem.title, poem.author, '', ...poem.lines].join('\n'));
    showFlash('text');
  }

  async function shareLink() {
    const url = pageOrigin() + buildPoemPath(poem);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: poem.title, url });
        return;
      } catch {
        /* user dismissed the share sheet — fall back to copying */
      }
    }
    await copyToClipboard(url);
    showFlash('link');
  }

  return (
    <article className={styles.view}>
      <header className={styles.head}>
        <h1 className={styles.title}>{poem.title}</h1>
        <p className={styles.author}>{poem.author}</p>
        {poem.linecount > 0 && (
          <p className={styles.meta}>
            {poem.linecount} {poem.linecount === 1 ? 'line' : 'lines'}
          </p>
        )}
      </header>

      <div className={styles.actions}>
        <SaveButton poem={poem} />
        <button type="button" className={styles.action} onClick={copyPoem}>
          {flash === 'text' ? 'Copied' : 'Copy poem'}
        </button>
        <button type="button" className={styles.action} onClick={shareLink}>
          {flash === 'link' ? 'Copied' : 'Share link'}
        </button>
      </div>

      <div className={styles.body}>
        {poem.lines.map((line, i) => (
          <div key={i} data-testid="poem-line" className={styles.line}>
            {line}
          </div>
        ))}
      </div>
    </article>
  );
}
