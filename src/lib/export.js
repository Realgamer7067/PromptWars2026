function optionLetter(index) {
  return String.fromCharCode(97 + index);
}

export function buildStudyPackMarkdown(pack, sourceFilename, omittedPages = []) {
  const lines = [];
  lines.push(`# ${pack.title || 'Study Pack'}`);
  lines.push('');
  lines.push(`Source: ${sourceFilename}`);
  if (omittedPages.length) {
    lines.push(`Pages without extractable text: ${omittedPages.join(', ')}`);
  }
  lines.push('');

  lines.push('## Notes');
  lines.push('');
  for (const concept of pack.concepts) {
    lines.push(`### ${concept.title}`);
    for (const bullet of concept.bullets) {
      const cite = bullet.citation?.status === 'located' ? ` (PDF p.${bullet.citation.pageNumber})` : '';
      lines.push(`- ${bullet.text}${cite}`);
    }
    lines.push('');
  }

  lines.push('## Practice Questions');
  lines.push('');
  pack.quiz.forEach((q, i) => {
    lines.push(`${i + 1}. ${q.question}`);
    q.options.forEach((opt, idx) => {
      lines.push(`   ${optionLetter(idx)}) ${opt}`);
    });
    lines.push('');
  });

  lines.push('## Answer Key');
  lines.push('');
  pack.quiz.forEach((q, i) => {
    const letter = optionLetter(q.correctIndex);
    const cite =
      q.citation?.status === 'located' ? ` (PDF p.${q.citation.pageNumber}: "${q.citation.quote}")` : '';
    lines.push(`${i + 1}. ${letter}) ${q.options[q.correctIndex]} — ${q.explanation}${cite}`);
  });

  return lines.join('\n');
}

export function downloadTextFile(filename, content, mimeType = 'text/markdown') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
