import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { FileText, Download, Search, X } from 'lucide-react';
import { showError } from '../lib/swal';
import { useAuth } from '../context/AuthContext';

const TYPE_LABELS: Record<string, string> = {
  EMPLEADO: 'Colaborador',
  PROVEEDOR: 'Proveedor',
  INSTRUCTOR_EXTERNO: 'Facilitador externo',
  INSTRUCTOR_INTERNO: 'Facilitador interno',
  VISITANTE: 'Visitante',
  SERVICIO_EXTERNO: 'Personal externo',
  SALIDA_INDEPENDIENTE: 'Salida sin entrada',
};

const TIPOS = ['', ...Object.keys(TYPE_LABELS)];
const MOTIVOS = ['', 'Comedor', 'Servicio de cocina', 'Carga y descarga', 'Conductor/transporte', 'Entrega', 'Mantenimiento', 'Reunión', 'Visita general', 'Capacitación', 'Otro'];

const csvCell = (value: unknown): string => {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export default function ReportsPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [apiError, setApiError] = useState(false);
  const porPagina = 25;

  const [edificios, setEdificios] = useState<any[]>([]);
  const [filtroEdificio, setFiltroEdificio] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroMotivo, setFiltroMotivo] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  useEffect(() => {
    api.get('/edificios').then(r => {
      const all = r.data || [];
      const allowed = isAdmin ? all : all.filter((item: any) =>
        Number(item.Id || item.id) === Number(user?.edificioIdDefecto));
      setEdificios(allowed);
      if (!isAdmin && user?.edificioIdDefecto) {
        setFiltroEdificio(String(user.edificioIdDefecto));
      }
    }).catch(() => {});
  }, [isAdmin, user]);

  const load = useCallback(async (p: number) => {
    setLoading(true); setApiError(false);
    try {
      const params: any = { pagina: p, porPagina };
      if (filtroEdificio) params.edificioId = filtroEdificio;
      if (filtroTipo) params.tipoPersona = filtroTipo;
      if (filtroMotivo) params.motivoAcceso = filtroMotivo;
      if (filtroDesde) params.desde = filtroDesde;
      if (filtroHasta) params.hasta = filtroHasta;
      const res = await api.get('/acceso/reporte', { params });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { setApiError(true); }
    setLoading(false);
  }, [filtroEdificio, filtroTipo, filtroMotivo, filtroDesde, filtroHasta]);

  useEffect(() => { load(pagina); }, [pagina, load]);

  const buscar = () => { setPagina(1); load(1); };
  const totalPag = Math.max(1, Math.ceil(total / porPagina));

  const exportCSV = async () => {
    setExporting(true);
    try {
      const pageSize = 500;
      const appliedFilters: any = {};
      if (filtroEdificio) appliedFilters.edificioId = filtroEdificio;
      if (filtroTipo) appliedFilters.tipoPersona = filtroTipo;
      if (filtroMotivo) appliedFilters.motivoAcceso = filtroMotivo;
      if (filtroDesde) appliedFilters.desde = filtroDesde;
      if (filtroHasta) appliedFilters.hasta = filtroHasta;

      let all: any[] = [];
      let currentPage = 1;
      while (true) {
        const res = await api.get('/acceso/reporte', {
          params: { ...appliedFilters, pagina: currentPage, porPagina: pageSize },
        });
        const batch = res.data.data ?? [];
        all = all.concat(batch);
        if (all.length >= res.data.total || batch.length === 0) break;
        currentPage += 1;
      }

      const headers = ['Fecha', 'Persona', 'Tipo', 'Código', 'Empresa', 'Motivo', 'Detalle', 'Edificio', 'Entrada', 'Salida', 'Registró'];
      const rows = all.map((r: any) => [
        new Date(r.fechaEntrada).toLocaleDateString(),
        r.nombre,
        TYPE_LABELS[r.tipoPersona] || r.tipoPersona,
        r.cedula || '',
        r.empresa || '',
        r.motivoAcceso || '',
        r.motivoDetalle || '',
        r.edificio,
        new Date(r.fechaEntrada).toLocaleString(),
        r.fechaSalida ? new Date(r.fechaSalida).toLocaleString() : 'Pendiente',
        r.usuarioRegistra || '',
      ]);
      const csv = [headers.map(csvCell).join(','), ...rows.map(row => row.map(csvCell).join(','))].join('\r\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'reporte_accesos_completo.csv';
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    } catch (err: any) {
      showError('No se pudo exportar', err?.response?.data?.message || 'Intente nuevamente.');
    }
    setExporting(false);
  };

  const tipoLabel = (t: string) => TYPE_LABELS[t] || t;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title"><FileText className="icon" /> Reporte de Accesos</h1>
        <button onClick={exportCSV} disabled={exporting} className="btn btn--primary">
          <Download className="icon icon--sm" /> {exporting ? 'Exportando…' : 'Exportar CSV completo'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card__body">
          <div className="form-grid form-grid--3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            <div className="form-group">
              <label htmlFor="f-desde" className="form-label">Desde</label>
              <input id="f-desde" type="date" className="form-control" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="f-hasta" className="form-label">Hasta</label>
              <input id="f-hasta" type="date" className="form-control" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} />
            </div>
            {isAdmin && (
            <div className="form-group">
              <label htmlFor="f-edificio" className="form-label">Edificio</label>
              <select id="f-edificio" className="form-control" value={filtroEdificio} onChange={e => setFiltroEdificio(e.target.value)}>
                <option value="">Todos</option>
                {edificios.map((e: any) => <option key={e.Id || e.id} value={e.Id || e.id}>{e.Nombre || e.nombre}</option>)}
              </select>
            </div>
            )}
            <div className="form-group">
              <label htmlFor="f-tipo" className="form-label">Tipo de persona</label>
              <select id="f-tipo" className="form-control" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                {TIPOS.map(t => <option key={t} value={t}>{t ? (TYPE_LABELS[t] || t) : 'Todos'}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="f-motivo" className="form-label">Motivo</label>
              <select id="f-motivo" className="form-control" value={filtroMotivo} onChange={e => setFiltroMotivo(e.target.value)}>
                {MOTIVOS.map(m => <option key={m} value={m}>{m || 'Todos'}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={buscar} className="btn btn--primary" disabled={loading} style={{ flex: 1 }}>
                <Search className="icon icon--sm" /> {loading ? 'Buscando…' : 'Buscar'}
              </button>
              <button onClick={() => { setFiltroEdificio(''); setFiltroTipo(''); setFiltroMotivo(''); setFiltroDesde(''); setFiltroHasta(''); }} className="btn btn--ghost btn--sm" style={{ marginLeft: 8 }} aria-label="Limpiar filtros"><X className="icon icon--sm" /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        {apiError ? (
          <div className="empty-state"><p className="empty-state__desc">Error al cargar el reporte.</p><button onClick={() => load(pagina)} className="btn btn--primary btn--sm mt-2">Reintentar</button></div>
        ) : loading ? (
          <div className="empty-state"><div className="spinner mx-auto" /></div>
        ) : (
          <>
          <div className="table-wrapper report-table-desktop">
            <table className="table">
              <caption className="visually-hidden">Historial de accesos a edificios</caption>
              <thead><tr>
                <th scope="col">Fecha</th><th scope="col">Persona</th>
                <th scope="col">Tipo</th><th scope="col">Código</th><th scope="col">Empresa</th>
                <th scope="col">Motivo</th><th scope="col">Detalle</th><th scope="col">Edificio</th>
                <th scope="col" className="text-center">Entrada</th><th scope="col" className="text-center">Salida</th>
                <th scope="col">Registró</th>
              </tr></thead>
              <tbody>
                {data.map((r: any) => (
                  <tr key={r.id}>
                    <td className="text-xs">{new Date(r.fechaEntrada).toLocaleDateString()}</td>
                    <td className="font-bold">{r.nombre}</td>
                    <td><span className="badge badge--neutral">{tipoLabel(r.tipoPersona)}</span></td>
                    <td className="text-muted text-xs">{r.cedula || '-'}</td>
                    <td className="text-xs text-muted">{r.empresa || '-'}</td>
                    <td className="text-xs">{r.motivoAcceso || '-'}</td>
                    <td className="text-xs text-muted">{r.motivoDetalle || '-'}</td>
                    <td className="text-xs">{r.edificio}</td>
                    <td className="text-center text-xs">{new Date(r.fechaEntrada).toLocaleTimeString()}</td>
                    <td className="text-center">{r.fechaSalida ? <span className="badge badge--neutral">{new Date(r.fechaSalida).toLocaleTimeString()}</span> : <span className="badge badge--neutral">—</span>}</td>
                    <td className="text-xs text-muted">{r.usuarioRegistra || '-'}</td>
                  </tr>
                ))}
                {data.length === 0 && <tr className="catalog-empty"><td colSpan={11}>Sin resultados. Ajuste los filtros e intente de nuevo.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="report-cards-mobile">
            {data.map((r: any) => (
              <div key={r.id} className="access-card">
                <div className="access-card__header">
                  <div>
                    <div className="access-card__name">{r.nombre}</div>
                    <span className="badge badge--neutral">{tipoLabel(r.tipoPersona)}</span>
                  </div>
                  <div className="access-card__badge">
                    <span className="text-xs">{new Date(r.fechaEntrada).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="access-card__details">
                  {r.edificio} {r.motivoAcceso ? `· ${r.motivoAcceso}` : ''}
                </div>
                <div className="access-card__time">
                  <span>Entrada: {new Date(r.fechaEntrada).toLocaleTimeString()}</span>
                  {r.fechaSalida && <span>Salida: {new Date(r.fechaSalida).toLocaleTimeString()}</span>}
                  {!r.fechaSalida && <span className="badge badge--neutral">Sin salida</span>}
                </div>
                <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                  {r.cedula ? `Código: ${r.cedula} · ` : ''}
                  {r.empresa ? `Empresa: ${r.empresa} · ` : ''}
                  {r.motivoDetalle ? `Detalle: ${r.motivoDetalle} · ` : ''}
                  Registró: {r.usuarioRegistra || '-'}
                </div>
              </div>
            ))}
            {data.length === 0 && (
              <div className="empty-state empty-state--compact">
                <p className="empty-state__desc">Sin resultados. Ajuste los filtros.</p>
              </div>
            )}
          </div>
          </>
        )}

        {totalPag > 1 && (
          <div className="card__footer">
            <span className="text-muted text-xs">{total} registro(s) — Pág {pagina} de {totalPag}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="btn btn--secondary btn--sm">← Anterior</button>
              <button onClick={() => setPagina(p => Math.min(totalPag, p + 1))} disabled={pagina >= totalPag} className="btn btn--secondary btn--sm">Siguiente →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}