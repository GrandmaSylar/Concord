'use server'

import { createClient } from '@/utils/supabase/server'

// ── Types ──────────────────────────────────────────────────────────────────
export interface ConstituencyContact {
 id: string
 name: string
 phone: string | null
 voter_id: string | null
 position: string | null
 polling_station: string | null
 polling_station_code: string | null
 sub_area: string
 has_contact: boolean
 has_voter_id: boolean
 group_name: string
}

export interface FilterParams {
 sub_area?: string
 position?: string
 polling_station_code?: string
 has_contact?: boolean
 has_voter_id?: boolean
 search?: string
 page?: number
 pageSize?: number
}

export interface GroupOptions {
 sub_areas: string[]
 positions: string[]
 polling_stations: { code: string; name: string; sub_area: string }[]
}

export interface ContactStats {
 total: number
 with_contact: number
 without_contact: number
 sub_area_count: number
 station_count: number
}

// ── Base query helper: only constituency contacts (those with sub_area) ────
function applyFilters(query: any, filters: FilterParams) {
 // Only constituency contacts
 query = query.not('sub_area', 'is', null)

 if (filters.sub_area) query = query.eq('sub_area', filters.sub_area)
 if (filters.position) query = query.eq('position', filters.position)
 if (filters.polling_station_code) query = query.eq('polling_station_code', filters.polling_station_code)
 if (filters.has_contact !== undefined) query = query.eq('has_contact', filters.has_contact)
 if (filters.has_voter_id !== undefined) query = query.eq('has_voter_id', filters.has_voter_id)
 if (filters.search) {
 query = query.or(
 `name.ilike.%${filters.search}%,polling_station.ilike.%${filters.search}%,sub_area.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
 )
 }
 return query
}

// ── Get Filtered Contacts (paginated) ──────────────────────────────────────
export async function getConstituencyContacts(filters: FilterParams = {}) {
 const supabase = await createClient()
 const page = filters.page || 1
 const pageSize = filters.pageSize || 50
 const offset = (page - 1) * pageSize

 let query = supabase
 .from('contacts')
 .select('*', { count: 'exact' })

 query = applyFilters(query, filters)
 query = query
 .order('sub_area', { ascending: true })
 .order('polling_station', { ascending: true })
 .order('name', { ascending: true })
 .range(offset, offset + pageSize - 1)

 const { data, error, count } = await query

 if (error) {
 console.error('Error fetching constituency contacts:', error)
 return { contacts: [], total: 0 }
 }

 return { contacts: (data || []) as ConstituencyContact[], total: count || 0 }
}

// ── Get All Matching (for Select All) ──────────────────────────────────────
export async function getAllConstituencyContacts(filters: FilterParams = {}) {
 const supabase = await createClient()
 const allData: any[] = []
 let from = 0
 const limit = 1000

 while (true) {
 let query = supabase
 .from('contacts')
 .select('id, name, phone, position, sub_area, polling_station, has_contact')

 query = applyFilters(query, filters)
 query = query.order('name', { ascending: true })
 query = query.range(from, from + limit - 1)

 const { data, error } = await query
 if (error) {
 console.error('Error fetching all constituency contacts:', error)
 break
 }
 allData.push(...(data || []))
 if (!data || data.length < limit) break
 from += limit
 }

 return allData
}

// ── Get Group Options ──────────────────────────────────────────────────────
export async function getConstituencyGroups(): Promise<GroupOptions> {
  const supabase = await createClient()
  const allContacts: { sub_area: string | null; position: string | null; polling_station_code: string | null; polling_station: string | null }[] = []
  let from = 0
  const limit = 1000

  while (true) {
    const { data, error } = await supabase
      .from('contacts')
      .select('sub_area, position, polling_station_code, polling_station')
      .not('sub_area', 'is', null)
      .range(from, from + limit - 1)

    if (error) {
      console.error('Error fetching constituency groups data:', error)
      break
    }
    allContacts.push(...(data || []))
    if (!data || data.length < limit) break
    from += limit
  }

  const subAreasSet = new Set<string>()
  const positionsSet = new Set<string>()
  const stationMap = new Map<string, { code: string; name: string; sub_area: string }>()

  for (const c of allContacts) {
    if (c.sub_area) {
      subAreasSet.add(c.sub_area)
    }
    if (c.position) {
      positionsSet.add(c.position)
    }
    if (c.polling_station_code && c.sub_area) {
      if (!stationMap.has(c.polling_station_code)) {
        stationMap.set(c.polling_station_code, {
          code: c.polling_station_code,
          name: c.polling_station || c.polling_station_code,
          sub_area: c.sub_area
        })
      }
    }
  }

  const sub_areas = Array.from(subAreasSet).sort()
  const positions = Array.from(positionsSet).sort()
  const polling_stations = Array.from(stationMap.values()).sort((a, b) => a.name.localeCompare(b.name))

  return { sub_areas, positions, polling_stations }
}

// ── Get Stats ──────────────────────────────────────────────────────────────
export async function getConstituencyStats(filters: FilterParams = {}): Promise<ContactStats> {
 const supabase = await createClient()
 const allData: any[] = []
 let from = 0
 const limit = 1000

 while (true) {
 let query = supabase
 .from('contacts')
 .select('id, has_contact, has_voter_id, sub_area, polling_station_code')

 query = applyFilters(query, filters)
 query = query.range(from, from + limit - 1)

 const { data, error } = await query
 if (error) {
 console.error('Error fetching stats page:', error)
 break
 }
 allData.push(...(data || []))
 if (!data || data.length < limit) break
 from += limit
 }

 return {
 total: allData.length,
 with_contact: allData.filter(r => r.has_contact).length,
 without_contact: allData.filter(r => !r.has_contact).length,
 sub_area_count: new Set(allData.map(r => r.sub_area)).size,
 station_count: new Set(allData.map(r => r.polling_station_code).filter(Boolean)).size,
 }
}
