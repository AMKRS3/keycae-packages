'use client';

import React, { useState, useEffect } from 'react';

interface Invoice {
  id: string;
  numero_factura: number;
  cuit_emisor: string;
  tipo_comprobante: string;
  cae: string;
  total: number;
  createdAt: string;
  status: string;
}

export default function DashboardInbox() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [cuitInput, setCuitInput] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Simulated initial demo data
  const demoInvoices: Invoice[] = [
    {
      id: 'inv_abc123',
      numero_factura: 142,
      cuit_emisor: '20254459306',
      tipo_comprobante: 'C',
      cae: '76142098471253',
      total: 120000,
      createdAt: '2026-05-24T18:30:00Z',
      status: 'APROBADO por ARCA ✅',
    },
    {
      id: 'inv_xyz789',
      numero_factura: 143,
      cuit_emisor: '20254459306',
      tipo_comprobante: 'C',
      cae: '76294018274615',
      total: 85000,
      createdAt: '2026-05-25T01:15:00Z',
      status: 'APROBADO por ARCA ✅',
    },
  ];

  useEffect(() => {
    // Load initial demo data or fetch from local storage
    setInvoices(demoInvoices);
    setLoading(false);
  }, []);

  const handleFetch = async () => {
    if (!apiKey) {
      alert('Por favor introduce tu API Key de KeyCAE');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/v1/invoices', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || data);
      } else {
        alert('Error al conectar con la API de KeyCAE.ar');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión local.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logoBlock}>
          <span style={styles.logoEmoji}>🚀</span>
          <h1 style={styles.logoText}>Vibe Invoice Inbox</h1>
          <span style={styles.badge}>Next.js Console</span>
        </div>
        <div style={styles.authBlock}>
          <input
            type="password"
            placeholder="API Key Bearer (sk_test_...)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleFetch} style={styles.btnPrimary}>Conectar API</button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.grid}>
          {/* Left panel: List */}
          <section style={styles.panelList}>
            <h2 style={styles.sectionTitle}>Comprobantes Emitidos (ARCA)</h2>
            {loading ? (
              <p style={styles.infoText}>Cargando comprobantes...</p>
            ) : invoices.length === 0 ? (
              <p style={styles.infoText}>No hay comprobantes autorizados aún.</p>
            ) : (
              <div style={styles.list}>
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    style={{
                      ...styles.card,
                      borderColor: selectedInvoice?.id === inv.id ? '#10b981' : 'rgba(255,255,255,0.06)',
                      background: selectedInvoice?.id === inv.id ? 'rgba(16,185,129,0.05)' : '#161619',
                    }}
                  >
                    <div style={styles.cardHeader}>
                      <span style={styles.cardTitle}>Factura {inv.tipo_comprobante} - {inv.numero_factura}</span>
                      <span style={styles.cardPrice}>${inv.total.toLocaleString('es-AR')} ARS</span>
                    </div>
                    <div style={styles.cardBody}>
                      <p style={styles.cardMeta}>CUIT Emisor: <strong>{inv.cuit_emisor}</strong></p>
                      <p style={styles.cardMeta}>CAE: <code style={styles.code}>{inv.cae}</code></p>
                      <span style={styles.cardStatus}>{inv.status || 'Estado: Aprobado'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Right panel: Details Viewer */}
          <section style={styles.panelDetail}>
            <h2 style={styles.sectionTitle}>Vista Detallada del Comprobante</h2>
            {selectedInvoice ? (
              <div style={styles.detailContainer}>
                <div style={styles.detailHeader}>
                  <h3>Factura Autorizada con CAE</h3>
                  <span style={styles.successBadge}>Aprobado por ARCA</span>
                </div>
                <div style={styles.detailGrid}>
                  <div style={styles.detailItem}>
                    <strong>Identificador único:</strong>
                    <span>{selectedInvoice.id}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <strong>Punto de Venta / Nro:</strong>
                    <span>0001 - {selectedInvoice.numero_factura}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <strong>CUIT Emisor:</strong>
                    <span>{selectedInvoice.cuit_emisor}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <strong>CAE Fiscal ARCA:</strong>
                    <span style={styles.codeHighlight}>{selectedInvoice.cae}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <strong>Total Autorizado:</strong>
                    <span style={styles.priceHighlight}>${selectedInvoice.total.toLocaleString('es-AR')} ARS</span>
                  </div>
                </div>

                <div style={styles.actionBlock}>
                  <a
                    href={`http://localhost:3000/v1/invoices/${selectedInvoice.id}/pdf`}
                    target="_blank"
                    style={styles.actionBtn}
                  >
                    📄 Ver PDF A4 Oficial
                  </a>
                  <button
                    onClick={() => alert(`Escaneando QR del CAE: ${selectedInvoice.cae}`)}
                    style={styles.actionBtnSecondary}
                  >
                    🔍 Consultar en ARCA
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.placeholderBlock}>
                <span style={styles.placeholderIcon}>📄</span>
                <p>Selecciona una factura del panel izquierdo para visualizar su auditoría criptográfica, código CAE, enlaces de impresión A4 y metadatos de ARCA.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// Inlined styles for standalone execution without setup overhead
const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#0a0a0c',
    color: '#f9fafb',
    minHeight: '100vh',
    fontFamily: "'Inter', sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121215',
  },
  logoBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoEmoji: {
    fontSize: '24px',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  badge: {
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
    border: '1px solid rgba(16,185,129,0.2)',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  authBlock: {
    display: 'flex',
    gap: '12px',
  },
  input: {
    backgroundColor: '#0f0f11',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#fff',
    width: '240px',
  },
  btnPrimary: {
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  main: {
    flexGrow: 1,
    padding: '24px',
    display: 'flex',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '380px 1fr',
    gap: '24px',
    width: '100%',
  },
  panelList: {
    backgroundColor: '#121215',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#9ca3af',
    marginBottom: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    paddingBottom: '8px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
  },
  card: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '10px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: '13.5px',
  },
  cardPrice: {
    fontWeight: '700',
    color: '#10b981',
    fontSize: '13.5px',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  cardMeta: {
    fontSize: '11px',
    color: '#9ca3af',
    margin: 0,
  },
  cardStatus: {
    fontSize: '10px',
    color: '#10b981',
    fontWeight: '600',
    marginTop: '6px',
  },
  code: {
    fontFamily: 'monospace',
    color: '#cbd5e1',
  },
  panelDetail: {
    backgroundColor: '#121215',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  detailContainer: {
    padding: '20px',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  successBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    color: '#10b981',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  detailGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    backgroundColor: '#161619',
    borderRadius: '10px',
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.03)',
    marginBottom: '24px',
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13.5px',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    paddingBottom: '10px',
  },
  codeHighlight: {
    fontFamily: 'monospace',
    color: '#10b981',
    fontWeight: '700',
  },
  priceHighlight: {
    fontWeight: '800',
    color: '#10b981',
  },
  actionBlock: {
    display: 'flex',
    gap: '12px',
  },
  actionBtn: {
    flexGrow: 1,
    backgroundColor: '#10b981',
    color: '#fff',
    textDecoration: 'none',
    textAlign: 'center',
    padding: '12px 0',
    borderRadius: '8px',
    fontSize: '13.5px',
    fontWeight: '600',
    transition: 'background 0.2s',
  },
  actionBtnSecondary: {
    flexGrow: 1,
    backgroundColor: 'transparent',
    color: '#9ca3af',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    fontSize: '13.5px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  placeholderBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    flexGrow: 1,
    padding: '40px',
    color: '#6b7280',
    fontSize: '13.5px',
    lineHeight: '1.6',
    maxWidth: '450px',
    margin: '0 auto',
  },
  placeholderIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5,
  },
  infoText: {
    color: '#6b7280',
    fontSize: '13px',
  },
};
