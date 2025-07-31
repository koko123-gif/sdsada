import React, { useState } from 'react'
import { User, MapPin, LogIn } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface LoginFormProps {
  onLogin: (voter: { id: string; name: string; address: string }) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isSupabaseConfigured) {
      setError('Database belum dikonfigurasi. Silakan klik "Connect to Supabase" di pojok kanan atas.')
      return
    }
    
    if (!name.trim() || !address.trim()) {
      setError('Nama dan alamat harus diisi')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      // Cek apakah voter dengan nama dan alamat yang sama sudah ada
      const { data: existingVoter, error: checkError } = await supabase
        .from('voters')
        .select('*')
        .eq('name', name.trim())
        .eq('address', address.trim())
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      let voterData
      
      if (existingVoter) {
        // Jika voter sudah ada, gunakan data yang ada
        voterData = existingVoter
        console.log('Existing voter found:', existingVoter)
      } else {
        // Jika voter belum ada, buat voter baru
        const { data, error } = await supabase
          .from('voters')
          .insert([{ 
            name: name.trim(), 
            address: address.trim()
          }])
          .select()
          .single()

        if (error) throw error
        voterData = data
        console.log('New voter created:', data)
      }

      onLogin({
        id: voterData.id,
        name: voterData.name,
        address: voterData.address,
        voted_for: voterData.voted_for
      })
    } catch (error) {
      console.error('Error creating voter:', error)
      setError('Terjadi kesalahan saat login. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Pemilihan Ketua Paguyuban
          </h1>
          <p className="text-gray-600">
            Silakan isi data diri Anda untuk melanjutkan
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Alamat
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Masukkan alamat lengkap"
                rows={3}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim() || !address.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
          >
            {isLoading ? 'Memproses...' : 'Masuk ke Pemilihan'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Sistem akan otomatis membuat akun baru jika belum terdaftar</p>
        </div>
      </div>
    </div>
  )
}