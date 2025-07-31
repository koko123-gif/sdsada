import React, { useState, useEffect } from 'react'
import { LogOut, Vote, Check, BarChart3 } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface VotingInterfaceProps {
  voter: { id: string; name: string; address: string; voted_for: string | null }
  onLogout: () => void
}

interface VoteCount {
  candidate_name: string
  count: number
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

export function VotingInterface({ voter, onLogout }: VotingInterfaceProps) {
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)
  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [isVoting, setIsVoting] = useState(false)
  const [myVote, setMyVote] = useState<string | null>(null)

  useEffect(() => {
    // Set initial vote from voter data if available
    if (voter.voted_for) {
      setHasVoted(true)
      setSelectedCandidate(voter.voted_for)
      setMyVote(voter.voted_for)
    }
    fetchVoteCounts()
    subscribeToVoters()
  }, [])

  const fetchVoteCounts = async () => {
    if (!isSupabaseConfigured) {
      // Set default values jika Supabase tidak dikonfigurasi
      const defaultCounts = CANDIDATES.map(candidate => ({
        candidate_name: candidate,
        count: 0
      }))
      setVoteCounts(defaultCounts)
      setTotalVotes(0)
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('voters')
        .select('voted_for')
        .not('voted_for', 'is', null)

      if (error) throw error

      const counts = CANDIDATES.map(candidate => ({
        candidate_name: candidate,
        count: data?.filter(voter => voter.voted_for === candidate).length || 0
      }))

      setVoteCounts(counts)
      setTotalVotes(data?.length || 0)
    } catch (error) {
      console.error('Error fetching vote counts:', error)
      // Set default values jika terjadi error
      const defaultCounts = CANDIDATES.map(candidate => ({
        candidate_name: candidate,
        count: 0
      }))
      setVoteCounts(defaultCounts)
      setTotalVotes(0)
    }
  }

  const subscribeToVoters = () => {
    if (!isSupabaseConfigured) return () => {}
    
    const channel = supabase
      .channel('voters-changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'voters' },
        () => {
          fetchVoteCounts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleVote = async (candidateName: string) => {
    if (hasVoted || isVoting) return
    
    if (!isSupabaseConfigured) {
      alert('Database belum dikonfigurasi. Silakan setup Supabase terlebih dahulu.')
      return
    }

    setIsVoting(true)
    try {
      // Cek sekali lagi apakah user sudah vote
      const { data: currentVoter, error: checkError } = await supabase
        .from('voters')
        .select('voted_for')
        .eq('user_id', voter.id)
        .single()

      if (checkError) throw checkError

      if (currentVoter?.voted_for) {
        setHasVoted(true)
        setSelectedCandidate(currentVoter.voted_for)
        setMyVote(currentVoter.voted_for)
        alert('Anda sudah memberikan suara sebelumnya.')
        return
      }

      // Update voted_for directly
      const { error: updateError } = await supabase
        .from('voters')
        .update({ voted_for: candidateName })
        .eq('id', voter.id)

      if (updateError) throw updateError

      // Update local state
      setHasVoted(true)
      setSelectedCandidate(candidateName)
      setMyVote(candidateName)
      
      // Refresh vote counts
      await fetchVoteCounts()
      
      // Show success message
      alert(`Terima kasih! Suara Anda untuk ${candidateName} telah berhasil disimpan.`)
      
    } catch (error) {
      console.error('Error voting:', error)
      alert(`Terjadi kesalahan saat memberikan suara: ${error.message || 'Unknown error'}. Silakan coba lagi.`)
    } finally {
      setIsVoting(false)
    }
  }

  const getVotePercentage = (count: number) => {
    return totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : '0.0'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Pemilihan Ketua Paguyuban
            </h1>
            <p className="text-gray-600">
              Selamat datang, <span className="font-semibold">{voter.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Total Suara: {totalVotes}</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {hasVoted && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Check className="w-5 h-5" />
              <span className="font-semibold">Terima kasih, suara Anda sudah terekam!</span>
            </div>
            <p>Anda telah memilih: <strong>{myVote}</strong></p>
            <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
              <p className="text-sm text-green-600">
                💡 <strong>Pilihan Anda:</strong> {myVote}
              </p>
              <p className="text-xs text-green-500 mt-1">
                Suara Anda telah tersimpan dengan aman dan tidak dapat diubah
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {CANDIDATES.map((candidate) => {
            const voteData = voteCounts.find(v => v.candidate_name === candidate)
            const count = voteData?.count || 0
            const percentage = getVotePercentage(count)
            const isMyChoice = myVote === candidate
            const isSelected = selectedCandidate === candidate

            return (
              <div
                key={candidate}
                className={`bg-white rounded-xl shadow-md p-6 transition-all hover:shadow-lg relative ${
                  isMyChoice ? 'ring-2 ring-green-500 bg-green-50' : ''
                }`}
              >
                {isMyChoice && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    Pilihan Saya
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 relative ${
                    isMyChoice ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {isMyChoice ? (
                      <Check className="w-8 h-8" />
                    ) : (
                      <Vote className="w-8 h-8" />
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">
                    {candidate}
                  </h3>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{count} suara</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isMyChoice ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleVote(candidate)}
                  disabled={hasVoted || isVoting}
                  className={`w-full py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                    hasVoted
                      ? isMyChoice
                        ? 'bg-green-500 text-white cursor-default'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                  }`}
                >
                  {isVoting ? 'Memproses...' : hasVoted ? (isMyChoice ? 'Pilihan Saya' : 'Tidak Aktif') : 'Pilih'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}