import { Fragment, type ReactNode } from 'react';
import clsx from 'clsx';

/**
 * Minimal, safe markdown renderer for AI replies (headings, lists, tables,
 * quotes, rules, **bold**, *italic*, `code`). Builds React elements only —
 * never injects raw HTML.
 */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith('**')) {
      nodes.push(<strong key={key} className="font-semibold text-ink">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      nodes.push(<code key={key} className="font-mono text-[0.9em] bg-stone-100 rounded px-1">{token.slice(1, -1)}</code>);
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isTableDivider = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
const splitCells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

export function AiMarkdown({ content, className }: { content: string; className?: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    const key = `b${i}`;

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push(<hr key={key} className="border-stone-200/80 my-1" />);
      i += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      blocks.push(
        <div
          key={key}
          className={clsx(
            'font-display text-ink',
            level <= 2 ? 'text-[15px] pt-1' : 'text-[14px]'
          )}
        >
          {renderInline(heading[2], key)}
        </div>
      );
      i += 1;
      continue;
    }

    if (isTableRow(line) && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      const header = splitCells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitCells(lines[i]));
        i += 1;
      }
      blocks.push(
        <div key={key} className="overflow-x-auto rounded-lg border border-stone-200/80 bg-white/70">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-stone-50">
                {header.map((h, c) => (
                  <th key={c} className="text-left font-semibold text-ink px-3 py-2 border-b border-stone-200/80">
                    {renderInline(h, `${key}h${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r} className="border-b border-stone-100 last:border-b-0 align-top">
                  {row.map((cell, c) => (
                    <td key={c} className="px-3 py-2 text-stone-600">
                      {renderInline(cell, `${key}r${r}c${c}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quote.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push(
        <div key={key} className="border-l-[3px] border-sage/50 pl-3 text-stone-500 text-[12.5px]">
          {renderInline(quote.join(' '), key)}
        </div>
      );
      continue;
    }

    const listMatch = (l: string) => l.match(/^\s*([-*•]|\d+[.)])\s+(.*)$/);
    if (listMatch(line)) {
      const ordered = /^\s*\d/.test(line);
      const items: string[] = [];
      while (i < lines.length && listMatch(lines[i])) {
        items.push(listMatch(lines[i])![2]);
        i += 1;
      }
      const ListTag = ordered ? 'ol' : 'ul';
      blocks.push(
        <ListTag
          key={key}
          className={clsx('space-y-1 pl-5', ordered ? 'list-decimal marker:font-mono marker:text-stone-400' : 'list-disc marker:text-sage')}
        >
          {items.map((item, n) => (
            <li key={n} className="pl-0.5">{renderInline(item, `${key}i${n}`)}</li>
          ))}
        </ListTag>
      );
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !listMatch(lines[i]) &&
      !/^(#{1,6})\s/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith('>') &&
      !isTableRow(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      para.push(lines[i].trim());
      i += 1;
    }
    blocks.push(
      <p key={key}>
        {para.map((p, n) => (
          <Fragment key={n}>
            {n > 0 && <br />}
            {renderInline(p, `${key}p${n}`)}
          </Fragment>
        ))}
      </p>
    );
  }

  return <div className={clsx('space-y-2.5', className)}>{blocks}</div>;
}
