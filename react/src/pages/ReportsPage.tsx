import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { FileText, Download, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { showError } from '../lib/swal';
import { useAuth } from '../context/AuthContext';

const TYPE_LABELS: Record<string, string> = {
  EMPLEADO: 'Colaborador', PROVEEDOR: 'Proveedor',
  INSTRUCTOR_EXTERNO: 'Facilitador externo', INSTRUCTOR_INTERNO: 'Facilitador interno',
  VISITANTE: 'Visitante', SERVICIO_EXTERNO: 'Personal externo',
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
  const [tab, setTab] = useState<'historial' | 'sin_salida' | 'sin_entrada'>('historial');
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const porPagina = 25;

  // Filters
  const [edificios, setEdificios] = useState<any[]>([]);
  const [periodo, setPeriodo] = useState('hoy');
  const [filtroEdificio, setFiltroEdificio] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroMotivo, setFiltroMotivo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [draftPeriodo, setDraftPeriodo] = useState('hoy');
  const [draftBusqueda, setDraftBusqueda] = useState('');
  const [draftEdificio, setDraftEdificio] = useState('');
  const [draftTipo, setDraftTipo] = useState('');
  const [draftMotivo, setDraftMotivo] = useState('');
  const [draftEstado, setDraftEstado] = useState('');

  // Fechas para periodo
  const getFechas = (p: string) => {
    const ahora = new Date();
    switch (p) {
      case 'hoy': return { desde: ahora.toISOString().split('T')[0], hasta: ahora.toISOString().split('T')[0] };
      case 'ayer': {
        const ayer = new Date(ahora); ayer.setDate(ayer.getDate() - 1);
        return { desde: ayer.toISOString().split('T')[0], hasta: ayer.toISOString().split('T')[0] };
      }
      case 'semana': {
        const lunes = new Date(ahora); lunes.setDate(lunes.getDate() - lunes.getDay() + 1);
        return { desde: lunes.toISOString().split('T')[0], hasta: ahora.toISOString().split('T')[0] };
      }
      case 'mes': {
        const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        return { desde: inicio.toISOString().split('T')[0], hasta: ahora.toISOString().split('T')[0] };
      }
      default: return { desde: '', hasta: '' };
    }
  };

  useEffect(() => {
    api.get('/edificios').then(r => {
      const all = r.data || [];
      const allowed = isAdmin ? all : all.filter((item: any) =>
        Number(item.Id || item.id) === Number(user?.edificioIdDefecto));
      setEdificios(allowed);
      if (!isAdmin && user?.edificioIdDefecto) setDraftEdificio(String(user.edificioIdDefecto));
    }).catch(() => {});
  }, [isAdmin, user]);

  const load = useCallback(async (p: number) => {
    setLoading(true); setApiError(false);
    try {
      const params: any = { pagina: p, porPagina };
      if (filtroEdificio) params.edificioId = filtroEdificio;
      if (filtroTipo) params.tipoPersona = filtroTipo;
      if (filtroMotivo) params.motivoAcceso = filtroMotivo;
      const fechas = getFechas(periodo);
      if (fechas.desde) params.desde = fechas.desde;
      if (fechas.hasta) params.hasta = fechas.hasta;
      if (filtroBusqueda) {
        params.tipoPersona = 'EMPLEADO';
        params.query = filtroBusqueda;
      }
      const res = await api.get('/acceso/reporte', { params });
      let filtered = res.data.data || [];
      // Filtro de estado client-side (simplificado)
      if (filtroEstado === 'sin_salida') filtered = filtered.filter((r: any) => !r.fechaSalida);
      else if (filtroEstado === 'con_salida') filtered = filtered.filter((r: any) => r.fechaSalida);
      else if (filtroEstado === 'salida_independiente') filtered = filtered.filter((r: any) => r.tipoPersona === 'SALIDA_INDEPENDIENTE');

      setData(filtered);
      setTotal(res.data.total || 0);
    } catch { setApiError(true); }
    setLoading(false);
  }, [filtroEdificio, filtroTipo, filtroMotivo, filtroEstado, filtroBusqueda, periodo]);

  useEffect(() => { load(pagina); }, [pagina, load]);

  // Auto-filtrar segun tab
  useEffect(() => {
    if (tab === 'sin_salida') setFiltroEstado('sin_salida');
    else if (tab === 'sin_entrada') setFiltroEstado('salida_independiente');
    else setFiltroEstado('');
  }, [tab]);

  const buscar = () => {
    const fechas = getFechas(draftPeriodo);
    if (fechas.desde && fechas.hasta && fechas.desde > fechas.hasta) {
      showError('La fecha "Desde" no puede ser mayor que la fecha "Hasta".');
      return;
    }
    setFiltroEdificio(draftEdificio);
    setFiltroTipo(draftTipo);
    setFiltroMotivo(draftMotivo);
    setFiltroEstado(draftEstado);
    setFiltroBusqueda(draftBusqueda);
    setPeriodo(draftPeriodo);
    setPagina(1);
  };

  const limpiar = () => {
    setDraftPeriodo('hoy');
    setDraftBusqueda('');
    setDraftEdificio(isAdmin ? '' : String(user?.edificioIdDefecto || ''));
    setDraftTipo('');
    setDraftMotivo('');
    setDraftEstado('');
  };

  const totalPag = Math.max(1, Math.ceil(total / porPagina));

  const exportCSV = async () => {
    setExporting(true);
    try {
      const pageSize = 500;
      const appliedFilters: any = {};
      if (filtroEdificio) appliedFilters.edificioId = filtroEdificio;
      if (filtroTipo) appliedFilters.tipoPersona = filtroTipo;
      if (filtroMotivo) appliedFilters.motivoAcceso = filtroMotivo;
      const fechas = getFechas(periodo);
      if (fechas.desde) appliedFilters.desde = fechas.desde;
      if (fechas.hasta) appliedFilters.hasta = fechas.hasta;

      let all: any[] = [];
      let currentPage = 1;
      while (true) {
        const res = await api.get('/acceso/reporte', { params: { ...appliedFilters, pagina: currentPage, porPagina: pageSize } });
        const batch = res.data.data ?? [];
        all = all.concat(batch);
        if (all.length >= res.data.total || batch.length === 0) break;
        currentPage += 1;
      }

      if (filtroEstado === 'sin_salida') all = all.filter((r: any) => !r.fechaSalida);
      else if (filtroEstado === 'con_salida') all = all.filter((r: any) => r.fechaSalida);
      else if (filtroEstado === 'salida_independiente') all = all.filter((r: any) => r.tipoPersona === 'SALIDA_INDEPENDIENTE');

      const estadoSalida = (r: any) => {
        if (r.tipoPersona === 'SALIDA_INDEPENDIENTE') return 'Salida sin entrada';
        return r.fechaSalida ? 'Salida registrada' : 'Sin salida registrada';
      };

      const headers = ['Fecha', 'Hora entrada', 'Hora salida', 'Estado salida', 'Persona', 'Tipo', 'Código', 'Empresa', 'Motivo', 'Detalle', 'Edificio', 'Registró'];
      const rows = all.map((r: any) => [
        new Date(r.fechaEntrada).toLocaleDateString(),
        new Date(r.fechaEntrada).toLocaleTimeString(),
        r.fechaSalida ? new Date(r.fechaSalida).toLocaleTimeString() : '',
        estadoSalida(r),
        r.nombre, TYPE_LABELS[r.tipoPersona] || r.tipoPersona,
        r.cedula || '', r.empresa || '',
        r.motivoAcceso || '', r.motivoDetalle || '',
        r.edificio, r.usuarioRegistra || '',
      ]);
      const csv = [headers.map(csvCell).join(','), ...rows.map(row => row.map(csvCell).join(','))].join('\r\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `accesos_${periodo}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    } catch (err: any) { showError('No se pudo exportar', err?.response?.data?.message || 'Intente nuevamente.'); }
    setExporting(false);
  };

  const tipoLabel = (t: string) => TYPE_LABELS[t] || t;
  const estadoLabel = (r: any) => {
    if (r.tipoPersona === 'SALIDA_INDEPENDIENTE') return 'Salida sin entrada previa';
    return r.fechaSalida ? 'Salida registrada' : 'Sin salida registrada';
  };
  const estadoColor = (r: any) => {
    if (r.tipoPersona === 'SALIDA_INDEPENDIENTE') return 'badge--warning';
    return r.fechaSalida ? 'badge--success' : 'badge--neutral';
  };

  const chips: { label: string; onRemove?: () => void }[] = [];
  if (periodo !== 'hoy') chips.push({ label: periodo === 'ayer' ? 'Ayer' : periodo === 'semana' ? 'Esta semana' : 'Este mes', onRemove: () => setDraftPeriodo('hoy') });
  if (filtroEdificio) chips.push({ label: edificios.find(e => String(e.Id || e.id) === filtroEdificio)?.Nombre || 'Edificio', onRemove: () => { setDraftEdificio(''); } });
  if (filtroTipo) chips.push({ label: TYPE_LABELS[filtroTipo] || filtroTipo, onRemove: () => setDraftTipo('') });
  if (filtroMotivo) chips.push({ label: filtroMotivo, onRemove: () => setDraftMotivo('') });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title"><FileText className="icon" /> Historial y Reportes</h1>
        <button onClick={exportCSV} disabled={exporting} className="btn btn--primary">
          <Download className="icon icon--sm" /> {exporting ? 'Exportando…' : 'Descargar resultados'}
        </button>
      </div>

      {/* Pestañas */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid var(--gray-200)' }}>
        {(['historial', 'sin_salida', 'sin_entrada'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setPagina(1); }}
            style={{
              padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: tab === t ? 700 : 400, fontSize: 14,
              color: tab === t ? 'var(--brand-red)' : 'var(--gray-600)',
              borderBottom: tab === t ? '2px solid var(--brand-red)' : '2px solid transparent',
              marginBottom: -2
            }}>
            {t === 'historial' ? 'Historial de accesos' : t === 'sin_salida' ? 'Sin salida registrada' : 'Salidas sin entrada'}
          </button>
        ))}
      </div>

      {/* Filtros rápidos */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['hoy', 'ayer', 'semana', 'mes'].map(p => (
              <button key={p} onClick={() => setDraftPeriodo(p)}
                className={`btn btn--sm ${draftPeriodo === p ? 'btn--primary' : 'btn--secondary'}`}>
                {p === 'hoy' ? 'Hoy' : p === 'ayer' ? 'Ayer' : p === 'semana' ? 'Esta semana' : 'Este mes'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="text" className="form-control" value={draftBusqueda} onChange={e => setDraftBusqueda(e.target.value)}
              placeholder="Buscar persona, carnet o cédula…" style={{ maxWidth: 250, fontSize: 13, padding: '6px 8px' }} />
            {isAdmin && (
              <select className="form-control" value={draftEdificio} onChange={e => setDraftEdificio(e.target.value)}
                style={{ maxWidth: 180, fontSize: 13, padding: '6px 8px' }}>
                <option value="">Todos los edificios</option>
                {edificios.map((e: any) => <option key={e.Id || e.id} value={e.Id || e.id}>{e.Nombre || e.nombre}</option>)}
              </select>
            )}
            <select className="form-control" value={draftTipo} onChange={e => setDraftTipo(e.target.value)}
              style={{ maxWidth: 160, fontSize: 13, padding: '6px 8px' }}>
              <option value="">Todos los tipos</option>
              {TIPOS.filter(Boolean).map(t => <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>)}
            </select>
            <select className="form-control" value={draftMotivo} onChange={e => setDraftMotivo(e.target.value)}
              style={{ maxWidth: 160, fontSize: 13, padding: '6px 8px' }}>
              <option value="">Todos los motivos</option>
              {MOTIVOS.filter(Boolean).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={buscar} className="btn btn--primary btn--sm" disabled={loading}>
              <Search className="icon icon--sm" /> Ver resultados
            </button>
            <button onClick={limpiar} className="btn btn--secondary btn--sm">Limpiar</button>
          </div>

          {chips.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {chips.map((chip, i) => (
                <span key={i} className="badge badge--neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px' }}>
                  {chip.label}
                  {chip.onRemove && <X className="icon icon--sm" style={{ cursor: 'pointer' }} onClick={chip.onRemove} />}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        {apiError ? (
          <div className="empty-state"><p className="empty-state__desc">Error al cargar el reporte.</p><button onClick={() => load(pagina)} className="btn btn--primary btn--sm mt-2">Reintentar</button></div>
        ) : loading ? (
          <div className="empty-state"><div className="spinner mx-auto" /></div>
        ) : (
          <>
            {data.length > 0 && (
              <div style={{ padding: '12px 16px', background: 'var(--gray-50)', fontSize: 13, borderBottom: '1px solid var(--gray-200)' }}>
                {data.length} movimiento(s) encontrados ·{' '}
                {data.filter(r => r.fechaSalida || r.tipoPersona === 'SALIDA_INDEPENDIENTE').length} salida(s) ·{' '}
                {data.filter(r => !r.fechaSalida && r.tipoPersona !== 'SALIDA_INDEPENDIENTE').length} sin salida
              </div>
            )}
            <div className="table-wrapper report-table-desktop">
              <table className="table">
                <caption className="visually-hidden">Historial de accesos</caption>
                <thead><tr>
                  <th scope="col">Fecha</th><th scope="col">Persona</th>
                  <th scope="col">Tipo</th><th scope="col">Motivo</th>
                  {isAdmin && <th scope="col">Edificio</th>}
                  <th scope="col" className="text-center">Salida</th>
                  <th scope="col" className="text-center">Detalle</th>
                </tr></thead>
                <tbody>
                  {data.map((r: any) => (
                    <>
                      <tr key={r.id}>
                        <td className="text-xs">{new Date(r.fechaEntrada).toLocaleDateString()} {new Date(r.fechaEntrada).toLocaleTimeString()}</td>
                        <td className="font-bold">{r.nombre}</td>
                        <td><span className="badge badge--neutral">{tipoLabel(r.tipoPersona)}</span></td>
                        <td className="text-xs">{r.motivoAcceso || '-'}</td>
                        {isAdmin && <td className="text-xs">{r.edificio}</td>}
                        <td className="text-center"><span className={`badge ${estadoColor(r)}`} style={{ fontSize: 11 }}>{estadoLabel(r)}</span></td>
                        <td className="text-center">
                          <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} className="btn btn--ghost btn--sm btn--icon" aria-label="Ver detalle">
                            {expandedId === r.id ? <ChevronUp className="icon icon--sm" /> : <ChevronDown className="icon icon--sm" />}
                          </button>
                        </td>
                      </tr>
                      {expandedId === r.id && (
                        <tr key={`det-${r.id}`}>
                          <td colSpan={isAdmin ? 7 : 5} style={{ padding: '8px 16px', background: 'var(--gray-50)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, fontSize: 13 }}>
                              <div><strong>Código:</strong> {r.cedula || '—'}</div>
                              <div><strong>Empresa:</strong> {r.empresa || '—'}</div>
                              <div><strong>Detalle:</strong> {r.motivoDetalle || '—'}</div>
                              <div><strong>Registró:</strong> {r.usuarioRegistra || '—'}</div>
                              <div><strong>Entrada:</strong> {new Date(r.fechaEntrada).toLocaleString()}</div>
                              <div><strong>Salida:</strong> {r.fechaSalida ? new Date(r.fechaSalida).toLocaleString() : '—'}</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                  {data.length === 0 && <tr className="catalog-empty"><td colSpan={isAdmin ? 7 : 5}>Sin resultados. Ajuste los filtros e intente de nuevo.</td></tr>}
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
                      <span className={`badge ${estadoColor(r)}`} style={{ fontSize: 11 }}>{estadoLabel(r)}</span>
                    </div>
                  </div>
                  <div className="access-card__details">
                    {new Date(r.fechaEntrada).toLocaleDateString()} · {new Date(r.fechaEntrada).toLocaleTimeString()}
                    {r.edificio ? ` · ${r.edificio}` : ''}
                  </div>
                  <div className="access-card__time">
                    <span>Motivo: {r.motivoAcceso || '—'}</span>
                    {r.motivoDetalle && <span> · {r.motivoDetalle}</span>}
                  </div>
                  <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} className="btn btn--ghost btn--sm" style={{ width: '100%', marginTop: 4 }}>
                    {expandedId === r.id ? 'Ocultar detalle' : 'Ver detalle'}
                  </button>
                  {expandedId === r.id && (
                    <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 8, padding: 8, background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)' }}>
                      <div><strong>Código:</strong> {r.cedula || '—'}</div>
                      <div><strong>Empresa:</strong> {r.empresa || '—'}</div>
                      <div><strong>Registró:</strong> {r.usuarioRegistra || '—'}</div>
                    </div>
                  )}
                </div>
              ))}
              {data.length === 0 && <div className="empty-state empty-state--compact"><p className="empty-state__desc">Sin resultados</p></div>}
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

      <div style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', marginTop: 16, padding: '0 16px' }}>
        {data.length > 0 && (
          <p>Se descargarán los {data.length} resultados de los filtros aplicados.</p>
        )}
      </div>
    </div>
  );
}
