import { useState, useEffect } from 'react'
import { useStore } from '../../../stores/useStore'
import Topbar from '../../../components/layout/Topbar'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { getInitials } from '../../../lib/utils'
import {
  Plus, Pencil, Trash2, X, Search, ChevronLeft, ChevronRight,
  Mail, Phone, UserCheck, UserX
} from 'lucide-react'
import { toast } from 'sonner'

const DEPARTMENTS = ['Diseño', 'Desarrollo', 'Marketing', 'Ventas', 'Administración', 'Soporte', 'RRHH', 'Operaciones']
const ROLES_LIST = ['Director', 'Gerente', 'Senior', 'Junior', 'Practicante', 'Freelance', 'Consultor']
const STATUS_STYLES = {
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-red-100 text-red-600',
  vacation: 'bg-blue-100 text-blue-700',
}
const STATUS_LABELS = { active: 'Activo', inactive: 'Inactivo', vacation: 'Vacaciones' }

const AVATAR_COLORS = ['#6366F1','#8B5CF6','#EC4899','#EF4444','#F59E0B','#10B981','#3B82F6','#14B8A6']

const EMPTY_FORM = { name: '', email: '', phone: '', department: 'Diseño', role: 'Junior', status: 'active', start_date: '', notes: '' }

function EmployeePanel({ employee, onClose, onSave, title }) {
  const [form, setForm] = useState(employee || EMPTY_FORM)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[380px] z-50 bg-background border-l border-border flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {employee && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: employee.avatar_color }}>
                {getInitials(employee.name)}
              </div>
            )}
            <div>
              <p className="text-sm font-bold">{employee?.name || 'Nuevo empleado'}</p>
              <p className="text-xs text-muted-foreground">{title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {[
            { k: 'name',       l: 'Nombre completo', type: 'text' },
            { k: 'email',      l: 'Correo',          type: 'email' },
            { k: 'phone',      l: 'Teléfono',        type: 'tel' },
            { k: 'start_date', l: 'Fecha de ingreso', type: 'date' },
          ].map(f => (
            <div key={f.k} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{f.l}</Label>
              <input type={f.type} value={form[f.k] || ''} onChange={e => set(f.k, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background outline-none focus:border-foreground transition-colors" />
            </div>
          ))}

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Departamento</Label>
            <select value={form.department} onChange={e => set('department', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background outline-none focus:border-foreground">
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Cargo / Nivel</Label>
            <select value={form.role} onChange={e => set('role', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background outline-none focus:border-foreground">
              {ROLES_LIST.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Estado</Label>
            <div className="flex gap-2">
              {Object.entries(STATUS_LABELS).map(([k, l]) => (
                <button key={k} onClick={() => set('status', k)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    form.status === k ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/50'
                  }`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notas</Label>
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)}
              rows={3} placeholder="Notas internas..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background outline-none focus:border-foreground resize-none transition-colors" />
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button size="sm" className="flex-1" onClick={() => {
            if (!form.name || !form.email) return toast.error('Nombre y correo son requeridos')
            onSave(form)
          }}>Guardar</Button>
        </div>
      </div>
    </>
  )
}

export default function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, fetchEmployees } = useStore()
  const [search, setSearch] = useState('')

  useEffect(() => { fetchEmployees() }, [])
  const [filterDept, setFilterDept] = useState('all')
  const [editEmp, setEditEmp] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  const handleSave = async (form) => {
    if (editEmp) {
      await updateEmployee(editEmp.id, form)
      toast.success('Empleado actualizado')
      setEditEmp(null)
    } else {
      await addEmployee({
        ...form,
        avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      })
      toast.success('Empleado agregado')
      setShowAdd(false)
    }
  }

  const handleDelete = async (id) => {
    await deleteEmployee(id)
    toast.success('Empleado eliminado')
  }

  const filtered = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase())
    const matchDept = filterDept === 'all' || e.department === filterDept
    return matchSearch && matchDept
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageEmps = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const active = employees.filter(e => e.status === 'active').length
  const depts = [...new Set(employees.map(e => e.department))].length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Empleados"
        actions={
          <Button size="sm" onClick={() => setShowAdd(true)} className="text-xs rounded-full px-4">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Agregar empleado
          </Button>
        }
      />

      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full rounded-xl border border-border bg-background overflow-hidden flex flex-col shadow-sm">

          {/* Stats */}
          <div className="grid grid-cols-4 border-b border-border shrink-0">
            {[
              { l: 'Total', v: employees.length },
              { l: 'Activos', v: active },
              { l: 'Departamentos', v: depts },
              { l: 'Vacaciones', v: employees.filter(e => e.status === 'vacation').length },
            ].map(s => (
              <div key={s.l} className="text-center py-3 border-r border-border last:border-r-0">
                <p className="text-xs text-muted-foreground">{s.l}</p>
                <p className="text-xl font-bold tabular-nums">{s.v}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border shrink-0">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Buscar empleado..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-background outline-none focus:border-foreground" />
            </div>
            <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setPage(1) }}
              className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background outline-none focus:border-foreground">
              <option value="all">Todos los depto.</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#f8f8f9] border-b border-border text-[11px] font-semibold text-muted-foreground">
                  <th className="px-4 py-2.5 text-left" style={{ width: 220 }}>Nombre</th>
                  <th className="px-4 py-2.5 text-left" style={{ width: 200 }}>Correo</th>
                  <th className="px-4 py-2.5 text-left" style={{ width: 130 }}>Departamento</th>
                  <th className="px-4 py-2.5 text-left" style={{ width: 110 }}>Cargo</th>
                  <th className="px-4 py-2.5 text-left" style={{ width: 100 }}>Estado</th>
                  <th className="px-4 py-2.5 text-left" style={{ width: 110 }}>Ingreso</th>
                  <th className="px-4 py-2.5 text-left" style={{ width: 80 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageEmps.map(emp => (
                  <tr key={emp.id} className="group border-b border-border/50 hover:bg-[#f8f9fa] transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          style={{ backgroundColor: emp.avatar_color }}>
                          {getInitials(emp.name)}
                        </div>
                        <span className="text-sm font-semibold truncate">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {emp.email ? (
                        <a href={`mailto:${emp.email}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{emp.email}</span>
                        </a>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{emp.department}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{emp.role}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[emp.status]}`}>
                        {STATUS_LABELS[emp.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {emp.start_date ? new Date(emp.start_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditEmp(emp)}
                          className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(emp.id)}
                          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageEmps.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center text-sm text-muted-foreground">
                      {search || filterDept !== 'all' ? 'Sin resultados para los filtros aplicados' : 'No hay empleados. Agrega el primero.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-2.5 border-t border-border flex items-center justify-between shrink-0">
            <span className="text-xs text-muted-foreground">
              {filtered.length === 0 ? '0' : `${(safePage - 1) * PER_PAGE + 1}–${Math.min(safePage * PER_PAGE, filtered.length)}`} de {filtered.length}
            </span>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-medium">{safePage}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {(showAdd || editEmp) && (
        <EmployeePanel
          employee={editEmp}
          title={editEmp ? 'Editar empleado' : 'Nuevo empleado'}
          onClose={() => { setShowAdd(false); setEditEmp(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
