import React, { useState, useEffect } from 'react'
import { Users, Eye, ArrowLeft, Search, Filter } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface VoterWithVote {
  id: string
  name: string
  address: string
  voted_for: string | null
  created_at: string
}

interface AdminViewProps {
  onBack: () => void
}

const CANDIDATES = [
  'Erich', 'Doni', 'M.Ilham', 'Ragil', 'Sutrisno', 'Bayu', 'Bambang', 'Azlika', 
  'Indra', 'Robert', 'Heri', 'Zerinof', 'Siska', 'Vina', 'Fadly', 'Taofik', 
  'Zakaria', 'Irfan', 'Rois', 'Farhan', 'Ozan', 'Joko', 'Awal', 'Sudariyanto', 
  'Afriki', 'Arif H', 'Pringgo', 'Devi', 'Ferry', 'Reynal', 'Hermawan', 'Jerry', 
  'Rizal', 'Wanda', 'Abdul', 'Rama', 'Bilal', 'Ricky', 'Denny', 'Bowo', 'Toha', 
  'Daniel 1', 'Daniel 2', 'Ratih', 'Hermanto', 'Akmal', 'Acep', 'Andika', 'Arif', 
  'Ocan', 'Ajip', 'Tunggul', 'Alberto', 'Fitria', 'Edi', 'Rina', 'Fikri', 
  'Muchlis', 'Rizal Amin', 'Anjar', 'Iwan', 'Yoga', 'Sri', 'Gendras', 'Vinie', 
  'Handoko', 'Ariyanto', 'Bu Rizka', 'Tomi', 'Samuel', 'Feodella', 'Asmariah', 
  'Arnold', 'Fandy', 'Ilham Dwi', 'Efendi', 'Syafiyyah', 'Benedecta'
]

export function AdminView({ onBack }: AdminViewProps) {
  const [voters, setVoters] = useState<VoterWithVote[]>([])
  const [filteredVoters, setFilteredVoters] = useState<VoterWithVote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<string>('all')
  const [totalVoters, setTotalVoters] = useState(0)
  const [totalVoted, setTotalVoted] = useState(0)

  useEffect(() => {
    fetchVoters()
  }, [])

  useEffect(() => {
    filterVoters()
  }, [voters, searchTerm, selectedCandidate])

  const fetchVoters = async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('voters')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setVoters(data || [])
      setTotalVoters(data?.length || 0)
      setTotalVoted(data?.filter(voter => voter.voted_for).length || 0)
    } catch (error) {
      console.error('Error fetching voters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterVoters = () => {
    let filtered = voters

    // Filter by search term (name or address)
    if (searchTerm) {
      filtered = filtered.filter(voter => 
        voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voter.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by candidate
    if (selectedCandidate !== 'all') {
      if (selectedCandidate === 'not-voted') {
        filtered = filtered.filter(voter => !voter.voted_for)
      } else {
        filtered = filtered.filter(voter => voter.voted_for === selectedCandidate)
      }
    }

    setFilteredVoters(filtered)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCandidateVoteCount = (candidate: string) => {
    return voters.filter(voter => voter.voted_for === candidate).length
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data pemilih...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Admin - Data Pemilih
                </h1>
                <p className="text-gray-600">
                  Total: {totalVoters} pemilih | Sudah memilih: {totalVoted} | Belum memilih: {totalVoters - totalVoted}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">{filteredVoters.length} data ditampilkan</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cari Pemilih
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Cari berdasarkan nama atau alamat..."
                />
              </div>
            </div>

            {/* Filter by Candidate */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter Berdasarkan Pilihan
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <select
                  value={selectedCandidate}
                  onChange={(e) => setSelectedCandidate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">Semua Pemilih ({totalVoters})</option>
                  <option value="not-voted">Belum Memilih ({totalVoters - totalVoted})</option>
                  {CANDIDATES.map(candidate => (
                    <option key={candidate} value={candidate}>
                      {candidate} ({getCandidateVoteCount(candidate)} suara)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Voters Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alamat
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pilihan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waktu Daftar
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVoters.map((voter, index) => (
                  <tr key={voter.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {voter.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {voter.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {voter.voted_for ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {voter.voted_for}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Belum Memilih
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(voter.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {voter.voted_for ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                          Sudah Memilih
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></div>
                          Belum Memilih
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredVoters.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || selectedCandidate !== 'all' 
                  ? 'Tidak ada data yang sesuai dengan filter'
                  : 'Belum ada data pemilih'
                }
              </p>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Pemilih</p>
                <p className="text-2xl font-bold text-gray-900">{totalVoters}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Sudah Memilih</p>
                <p className="text-2xl font-bold text-gray-900">{totalVoted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Belum Memilih</p>
                <p className="text-2xl font-bold text-gray-900">{totalVoters - totalVoted}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}