import { useState, useRef, useCallback, useEffect } from 'react'
import { Plus, Trash2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

const NODE_W = 140
const NODE_H = 48
const COLORS = [
  { bg: '#f4f4f5', border: '#d4d4d8', text: '#18181b' },
  { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' },
  { bg: '#ede9fe', border: '#c4b5fd', text: '#6d28d9' },
  { bg: '#dcfce7', border: '#86efac', text: '#15803d' },
  { bg: '#fef3c7', border: '#fcd34d', text: '#d97706' },
  { bg: '#fee2e2', border: '#fca5a5', text: '#dc2626' },
]

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export default function SitemapCanvas({ nodes, onChange }) {
  const canvasRef = useRef()
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 40, y: 40 })
  const [dragging, setDragging] = useState(null)          // { nodeId, startX, startY, origX, origY }
  const [panning, setPanning] = useState(null)            // { startX, startY, origPanX, origPanY }
  const [connecting, setConnecting] = useState(null)      // nodeId we started connecting from
  const [editingId, setEditingId] = useState(null)
  const [editVal, setEditVal] = useState('')
  const [hoveredNode, setHoveredNode] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)

  // ── Helpers ─────────────────────────────────────────
  const screenToCanvas = (sx, sy) => ({
    x: (sx - pan.x) / zoom,
    y: (sy - pan.y) / zoom,
  })

  const addNode = () => {
    const id = `n${Date.now()}`
    const newNode = {
      id, label: 'Nueva página',
      x: (200 + Math.random() * 200) / zoom,
      y: (200 + Math.random() * 100) / zoom,
      colorIdx: 0,
      connections: [],
    }
    onChange([...nodes, newNode])
    setTimeout(() => { setEditingId(id); setEditVal('Nueva página') }, 50)
  }

  const deleteNode = (id) => {
    onChange(
      nodes
        .filter(n => n.id !== id)
        .map(n => ({ ...n, connections: (n.connections || []).filter(c => c !== id) }))
    )
    if (selectedNode === id) setSelectedNode(null)
  }

  const updateNode = (id, data) => {
    onChange(nodes.map(n => n.id === id ? { ...n, ...data } : n))
  }

  const toggleConnection = (fromId, toId) => {
    const from = nodes.find(n => n.id === fromId)
    if (!from) return
    const already = (from.connections || []).includes(toId)
    updateNode(fromId, {
      connections: already
        ? (from.connections || []).filter(c => c !== toId)
        : [...(from.connections || []), toId]
    })
  }

  // ── Mouse handlers ───────────────────────────────────
  const onMouseDown = (e, nodeId) => {
    if (e.button !== 0) return
    e.stopPropagation()
    if (editingId) return
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    setSelectedNode(nodeId)
    setDragging({
      nodeId,
      startX: e.clientX, startY: e.clientY,
      origX: node.x, origY: node.y,
    })
  }

  const onCanvasMouseDown = (e) => {
    if (e.button === 1 || e.button === 0) {
      if (connecting) { setConnecting(null); return }
      setPanning({ startX: e.clientX, startY: e.clientY, origPanX: pan.x, origPanY: pan.y })
      setSelectedNode(null)
    }
  }

  const onMouseMove = useCallback((e) => {
    if (dragging) {
      const dx = (e.clientX - dragging.startX) / zoom
      const dy = (e.clientY - dragging.startY) / zoom
      updateNode(dragging.nodeId, { x: dragging.origX + dx, y: dragging.origY + dy })
    }
    if (panning) {
      setPan({ x: panning.origPanX + e.clientX - panning.startX, y: panning.origPanY + e.clientY - panning.startY })
    }
  }, [dragging, panning, zoom, nodes])

  const onMouseUp = useCallback(() => {
    setDragging(null)
    setPanning(null)
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp) }
  }, [onMouseMove, onMouseUp])

  const onWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(z => Math.max(0.3, Math.min(2.5, z * delta)))
  }

  const commitEdit = () => {
    if (editingId) updateNode(editingId, { label: editVal.trim() || 'Página' })
    setEditingId(null)
  }

  const handleConnectClick = (e, nodeId) => {
    e.stopPropagation()
    if (!connecting) { setConnecting(nodeId); return }
    if (connecting === nodeId) { setConnecting(null); return }
    toggleConnection(connecting, nodeId)
    setConnecting(null)
  }

  // ── Render connections ───────────────────────────────
  const renderConnections = () => {
    const lines = []
    nodes.forEach(from => {
      (from.connections || []).forEach(toId => {
        const to = nodes.find(n => n.id === toId)
        if (!to) return
        const fx = from.x + NODE_W / 2
        const fy = from.y + NODE_H / 2
        const tx = to.x + NODE_W / 2
        const ty = to.y + NODE_H / 2
        const mid = midpoint({ x: fx, y: fy }, { x: tx, y: ty })
        lines.push(
          <g key={`${from.id}-${toId}`}>
            <line x1={fx} y1={fy} x2={tx} y2={ty} stroke="#d4d4d8" strokeWidth={1.5} strokeDasharray="4 2" />
            <circle cx={mid.x} cy={mid.y} r={4} fill="#fff" stroke="#d4d4d8" strokeWidth={1} />
          </g>
        )
      })
    })
    return lines
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30 shrink-0">
        <button onClick={addNode} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Agregar página
        </button>
        <div className="h-4 w-px bg-border mx-1" />
        <button onClick={() => setZoom(z => Math.min(2.5, z * 1.2))} className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.max(0.3, z * 0.8))} className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={() => { setZoom(1); setPan({ x: 40, y: 40 }) }} className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
          <Maximize2 className="w-4 h-4" />
        </button>
        {connecting && (
          <div className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium animate-pulse">
            Click en otro nodo para conectar — Esc para cancelar
          </div>
        )}
        {selectedNode && !connecting && (
          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={() => handleConnectClick({ stopPropagation: () => {} }, selectedNode)}
              className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              🔗 Conectar
            </button>
            {/* Color picker */}
            <div className="flex gap-1">
              {COLORS.map((c, i) => (
                <button key={i} onClick={() => updateNode(selectedNode, { colorIdx: i })}
                  className="w-5 h-5 rounded-full border-2 transition-all hover:scale-110"
                  style={{ backgroundColor: c.bg, borderColor: c.border }} />
              ))}
            </div>
            <button onClick={() => deleteNode(selectedNode)} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {nodes.length === 0 && (
          <span className="text-xs text-muted-foreground ml-2">Canvas vacío — agrega páginas para construir el sitemap</span>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-hidden relative bg-[#fafafa] cursor-default"
        style={{ backgroundImage: 'radial-gradient(circle, #e4e4e7 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        onMouseDown={onCanvasMouseDown}
        onWheel={onWheel}
        onKeyDown={e => { if (e.key === 'Escape') { setConnecting(null); setEditingId(null) } }}
        tabIndex={0}
      >
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible' }}
        >
          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {renderConnections()}
          </g>
        </svg>

        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
            top: 0, left: 0,
          }}
        >
          {nodes.map(node => {
            const c = COLORS[node.colorIdx || 0]
            const isSelected = selectedNode === node.id
            const isConnecting = connecting === node.id
            const isHovered = hoveredNode === node.id

            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: node.x, top: node.y,
                  width: NODE_W, height: NODE_H,
                  backgroundColor: c.bg,
                  border: `2px solid ${isSelected || isConnecting ? '#18181b' : isHovered ? c.border : c.border}`,
                  borderRadius: 10,
                  boxShadow: isSelected ? '0 0 0 3px rgba(0,0,0,0.1)' : isConnecting ? '0 0 0 3px #3b82f640' : '0 1px 4px rgba(0,0,0,0.08)',
                  cursor: dragging?.nodeId === node.id ? 'grabbing' : 'grab',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  userSelect: 'none',
                  transition: 'box-shadow 0.1s',
                }}
                onMouseDown={e => onMouseDown(e, node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onDoubleClick={e => { e.stopPropagation(); setEditingId(node.id); setEditVal(node.label) }}
                onClick={e => { e.stopPropagation(); if (connecting && connecting !== node.id) { toggleConnection(connecting, node.id); setConnecting(null) } else setSelectedNode(node.id) }}
              >
                {editingId === node.id ? (
                  <input
                    value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null) }}
                    className="w-full text-center text-xs font-medium outline-none bg-transparent px-2"
                    style={{ color: c.text }}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-xs font-medium px-3 text-center leading-tight truncate" style={{ color: c.text }}>
                    {node.label}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
