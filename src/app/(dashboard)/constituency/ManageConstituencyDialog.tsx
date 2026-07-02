'use client'

import { useState, useTransition } from 'react'
import { X, Save, Plus, ArrowLeftRight, Landmark, BadgeAlert, Sparkles, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { renameSubArea, updatePollingStation, createNewSubArea, type GroupOptions } from './actions'

interface Props {
  isOpen: boolean
  onClose: () => void
  groups: GroupOptions
  onRefresh: () => void
}

type Mode = 'rename_area' | 'edit_station' | 'new_area'

export default function ManageConstituencyDialog({ isOpen, onClose, groups, onRefresh }: Props) {
  const [activeMode, setActiveMode] = useState<Mode>('rename_area')
  const [isPending, startTransition] = useTransition()

  // Rename Sub-Area state
  const [oldAreaName, setOldAreaName] = useState('')
  const [newAreaName, setNewAreaName] = useState('')

  // Edit Polling Station state
  const [stationSubArea, setStationSubArea] = useState('')
  const [selectedStationName, setSelectedStationName] = useState('')
  const [newStationName, setNewStationName] = useState('')
  const [newStationCode, setNewStationCode] = useState('')

  // Create New Sub-Area state
  const [createAreaName, setCreateAreaName] = useState('')
  const [createStationName, setCreateStationName] = useState('')
  const [createStationCode, setCreateStationCode] = useState('')

  if (!isOpen) return null

  // Get matching stations for the selected sub-area in Edit tab
  const filteredStations = groups.polling_stations.filter(
    s => !stationSubArea || s.sub_area === stationSubArea
  )

  const handleStationSelect = (stationName: string) => {
    setSelectedStationName(stationName)
    const matched = groups.polling_stations.find(s => s.name === stationName)
    if (matched) {
      setNewStationName(matched.name)
      setNewStationCode(matched.code || '')
      setStationSubArea(matched.sub_area)
    }
  }

  const handleRenameArea = () => {
    if (!oldAreaName || !newAreaName.trim()) {
      toast.error('Please enter all fields')
      return
    }

    startTransition(async () => {
      const res = await renameSubArea(oldAreaName, newAreaName.trim())
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Renamed sub-area from "${oldAreaName}" to "${newAreaName}" successfully!`)
        setOldAreaName('')
        setNewAreaName('')
        onRefresh()
      }
    })
  }

  const handleUpdateStation = () => {
    if (!selectedStationName || !newStationName.trim()) {
      toast.error('Please select a polling station and enter the new name')
      return
    }

    const matched = groups.polling_stations.find(s => s.name === selectedStationName)
    const oldCode = matched ? matched.code : null

    startTransition(async () => {
      const res = await updatePollingStation(
        stationSubArea,
        selectedStationName,
        oldCode,
        newStationName.trim(),
        newStationCode.trim() || null
      )
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Successfully updated details for "${newStationName}"!`)
        setSelectedStationName('')
        setNewStationName('')
        setNewStationCode('')
        onRefresh()
      }
    })
  }

  const handleCreateArea = () => {
    if (!createAreaName.trim()) {
      toast.error('Please enter a sub-area name')
      return
    }

    startTransition(async () => {
      const res = await createNewSubArea(
        createAreaName.trim(),
        createStationName.trim() || undefined,
        createStationCode.trim() || undefined
      )
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Created sub-area "${createAreaName}" successfully!`)
        setCreateAreaName('')
        setCreateStationName('')
        setCreateStationCode('')
        onRefresh()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-950">Manage Constituency Layout</h3>
              <p className="text-[11px] font-medium text-slate-500">Configure areas, rename labels, and link polling station codes.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-650 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="px-6 border-b border-slate-100 bg-white flex gap-4">
          <button
            onClick={() => setActiveMode('rename_area')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'rename_area' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Rename Sub-Area
          </button>
          <button
            onClick={() => setActiveMode('edit_station')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'edit_station' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            Configure Polling Station
          </button>
          <button
            onClick={() => setActiveMode('new_area')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'new_area' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Set Up New Area
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 max-h-[400px] overflow-y-auto">
          {activeMode === 'rename_area' && (
            <div className="space-y-4">
              <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg flex gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                  Renaming a sub-area will automatically update all matching constituency member records in the database.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Select Sub-Area</label>
                <select
                  value={oldAreaName}
                  onChange={e => setOldAreaName(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 text-xs py-2 px-3 bg-white text-slate-900 focus:border-indigo-500 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">Choose sub-area to rename...</option>
                  {groups.sub_areas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">New Name</label>
                <input
                  type="text"
                  placeholder="Enter new sub-area name (e.g. TETEGU EAST)..."
                  value={newAreaName}
                  onChange={e => setNewAreaName(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 text-xs py-2 px-3 bg-white text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleRenameArea}
                disabled={isPending || !oldAreaName || !newAreaName}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50 gap-2 cursor-pointer mt-4"
              >
                {isPending ? 'Updating...' : 'Rename Sub-Area'}
              </button>
            </div>
          )}

          {activeMode === 'edit_station' && (
            <div className="space-y-4">
              <div className="bg-amber-50/40 border border-amber-100 p-3 rounded-lg flex gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                  Use this tab to set or update polling codes for stations that are missing codes (such as Tetegu or Gonse).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Filter Sub-Area</label>
                  <select
                    value={stationSubArea}
                    onChange={e => {
                      setStationSubArea(e.target.value)
                      setSelectedStationName('')
                    }}
                    className="block w-full rounded-lg border border-slate-200 text-xs py-2 px-3 bg-white text-slate-900 cursor-pointer"
                  >
                    <option value="">All Sub-Areas</option>
                    {groups.sub_areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Select Polling Station</label>
                  <select
                    value={selectedStationName}
                    onChange={e => handleStationSelect(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 text-xs py-2 px-3 bg-white text-slate-900 cursor-pointer"
                  >
                    <option value="">Choose polling station...</option>
                    {filteredStations.map(st => (
                      <option key={st.name} value={st.name}>
                        {st.name} {st.code ? `(${st.code})` : '[No Code]'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedStationName && (
                <div className="border border-slate-100 rounded-lg p-4 bg-slate-50/50 space-y-3 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">Rename Polling Station</label>
                    <input
                      type="text"
                      value={newStationName}
                      onChange={e => setNewStationName(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 text-xs py-2 px-3 bg-white text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 uppercase">Polling Station Code</label>
                      <span className="text-[10px] text-slate-400 font-semibold">(e.g. C020501A)</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter code..."
                      value={newStationCode}
                      onChange={e => setNewStationCode(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 text-xs py-2 px-3 bg-white text-slate-900"
                    />
                  </div>

                  <button
                    onClick={handleUpdateStation}
                    disabled={isPending || !newStationName}
                    className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50 gap-2 cursor-pointer mt-2"
                  >
                    {isPending ? 'Saving...' : 'Save Station Details'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeMode === 'new_area' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">New Area Name</label>
                <input
                  type="text"
                  placeholder="Enter area name (e.g. GONSE NORTH)..."
                  value={createAreaName}
                  onChange={e => setCreateAreaName(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 text-xs py-2 px-3 bg-white text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">First Polling Station (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. TAXI RANK..."
                    value={createStationName}
                    onChange={e => setCreateStationName(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 text-xs py-2 px-3 bg-white text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Station Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. C020815..."
                    value={createStationCode}
                    onChange={e => setCreateStationCode(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 text-xs py-2 px-3 bg-white text-slate-900"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateArea}
                disabled={isPending || !createAreaName}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50 gap-2 cursor-pointer mt-4"
              >
                {isPending ? 'Setting up...' : 'Create New Sub-Area'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
