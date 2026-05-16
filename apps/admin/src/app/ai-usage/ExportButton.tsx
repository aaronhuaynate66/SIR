'use client';

export default function ExportButton() {
  function handleExport() {
    const a = document.createElement('a');
    a.href = '/api/ai-usage/export';
    a.download = '';
    a.click();
  }

  return (
    <button
      onClick={handleExport}
      style={{
        padding: '6px 14px',
        background: 'transparent',
        border: '1px solid #d1d5db',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        color: '#374151',
        cursor: 'pointer',
      }}
    >
      ↓ Exportar CSV
    </button>
  );
}
