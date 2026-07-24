import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { FileText, Download, Search, X } from 'lucide-react';

const TIPOS = ['', 'EMPLEADO', 'PROVEEDOR', 'INSTRUCTOR_EXTERNO', 'VISITANTE', 'SERVICIO_EXTERNO'];
const MOTIVOS = ['', 'Comedor', 'Servicio de cocina', 'Carga y descarga', 'Conductor/transporte', 'Entrega', 'Mantenimiento', 'Reunión', 'Visita general', 'Capacitación', 'Otro'];

export default function ReportsPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const porPagina = 25;

  // Filters
  const [edificios, setEdificios] = useState<any[]>([]);
  const [filtroEdificio, setFiltroEdificio] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroMotivo, setFiltroMotivo] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  useEffect(() => {
    api.get('/edificios').then(r => setEdificios(r.data || [])).catch(() => {});
  }, []);

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

  const exportCSV = () => {
    const headers = ['Fecha', 'Hora', 'Persona', 'Tipo', 'Cédula', 'Empresa', 'Motivo', 'Edificio', 'Entrada', 'Salida', 'Registró'];
    const rows = data.map(r => [
      new Date(r.fechaEntrada).toLocaleDateString(),
      new Date(r.fechaEntrada).toLocaleTimeString(),
      r.nombre, r.tipoPersona, r.cedula || '', r.empresa || '',
      r.motivoAcceso || '', r.edificio,
      new Date(r.fechaEntrada).toLocaleString(),
      r.fechaSalida ? new Date(r.fechaSalida).toLocaleString() : 'Pendiente',
      r.usuarioRegistra || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'reporte_accesos.csv'; link.click();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title"><FileText className="icon" /> Reporte de Accesos</h1>
        <button onClick={exportCSV} disabled={data.length === 0} className="btn btn--primary">
          <Download className="icon icon--sm" /> Exportar CSV
        </button>
      </div>

      {/* Filters */}
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
            <div className="form-group">
              <label htmlFor="f-edificio" className="form-label">Edificio</label>
              <select id="f-edificio" className="form-control" value={filtroEdificio} onChange={e => setFiltroEdificio(e.target.value)}>
                <option value="">Todos</option>
                {edificios.map((e: any) => <option key={e.Id || e.id} value={e.Id || e.id}>{e.Nombre || e.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="f-tipo" className="form-label">Tipo de persona</label>
              <select id="f-tipo" className="form-control" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                {TIPOS.map(t => <option key={t} value={t}>{t || 'Todos'}</option>)}
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

      {/* Table */}
      <div className="card">
        {apiError ? (
          <div className="empty-state"><p className="empty-state__desc">Error al cargar el reporte.</p><button onClick={() => load(pagina)} className="btn btn--primary btn--sm mt-2">Reintentar</button></div>
        ) : loading ? (
          <div className="empty-state"><div className="spinner mx-auto" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <caption className="visually-hidden">Historial de accesos a edificios</caption>
              <thead><tr>
                <th scope="col">Fecha</th><th scope="col">Hora</th><th scope="col">Persona</th>
                <th scope="col">Tipo</th><th scope="col">Cédula</th><th scope="col">Empresa</th>
                <th scope="col">Motivo</th><th scope="col">Edificio</th>
                <th scope="col" className="text-center">Entrada</th><th scope="col" className="text-center">Salida</th>
                <th scope="col">Registró</th>
              </tr></thead>
              <tbody>
                {data.map((r: any) => (
                  <tr key={r.id}>
                    <td className="text-xs">{new Date(r.fechaEntrada).toLocaleDateString()}</td>
                    <td className="text-xs">{new Date(r.fechaEntrada).toLocaleTimeString()}</td>
                    <td className="font-bold">{r.nombre}</td>
                    <td><span className="badge badge--neutral">{r.tipoPersona}</span></td>
                    <td className="text-muted text-xs">{r.cedula || '-'}</td>
                    <td className="text-xs text-muted">{r.empresa || '-'}</td>
                    <td className="text-xs">{r.motivoAcceso || '-'}</td>
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
