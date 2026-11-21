import { Word } from '../../core/types';

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadJson(data: unknown, filename: string) {
  download(filename, JSON.stringify(data, null, 2), 'application/json');
}

const csvEscape = (v: string): string => {
  if (/[",;\n]/.test(v)) return '"' + v.replaceAll('"', '""') + '"';
  return v;
};

export function downloadCsv(words: Word[]) {
  const header = ['German', 'Article', 'Type', 'Level', 'MeaningTR', 'MeaningEN', 'Plural', 'ExampleDE', 'ExampleTR', 'Favorite'];
  const rows = words.map((w) => [
    w.german, w.article ?? '', w.type, w.level ?? '',
    w.senses.map((s) => s.tr).join(' | '),
    w.senses.map((s) => s.en ?? '').join(' | '),
    w.noun?.plural ?? '',
    w.examples.map((e) => e.de).join(' | '),
    w.examples.map((e) => e.tr).join(' | '),
    w.favorite ? '1' : '0',
  ].map(csvEscape).join(';'));
  download(
    `kelime-defterim-${new Date().toISOString().slice(0, 10)}.csv`,
    '﻿' + [header.join(';'), ...rows].join('\n'),
    'text/csv;charset=utf-8',
  );
}